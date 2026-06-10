"""Remove near-white backgrounds from building assets via edge flood-fill, crop and downscale."""
import os
from collections import deque
import urllib.request
from PIL import Image

URLS = {
    'town_hall': 'https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/2898bcfc80ee83b5f651a303b7e9043949c2b97a1319bead7545a3776b95d6c4.png',
    'house': 'https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/01afd9e7c87858e59c38e53dc3a0c4f7582da8b9fa368659acf1b32d52049560.png',
    'barracks': 'https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/ff9da95b11b45c154a8e995c49fba8bea5dc56cfc97e1405311a39592a23ae2a.png',
    'farm': 'https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/d7711c1820e38c7459fd1f8bf3e265e9ff3346db361f5eb8635ef438afc1f5c3.png',
    'market': 'https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/ddac9e9f09490676db1ff979810d25cda276e6812a472cf434f224fdd7a7ecb1.png',
    'school': 'https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/c995953ff0402ac7107e0354380fcb8472d07c0d3f480f37f4c9d008d4214cb8.png',
    'library': 'https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/a1b00f8f0f3361ed74fd8c1c15b49355ca61d27bfed5149a6c1bdbcd80e7a29e.png',
    'lumber_mill': 'https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/6bd5a15e1e18cffda6bd953125c0d68e875ae23e086290a054707d381fa3865b.png',
    'quarry': 'https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/ae252c6b3a5f5487c3bd5c07a18f644029d53a7dbaf8736d3580521eadc1e000.png',
    'mine': 'https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/fe27e2a810b130f513eb8d6e0221ff40c03516948ef3f7d5ad75ede9df3c3534.png',
    'garden': 'https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/8264df0b51dfc766a35b0a4307d75ab03e5e3e5fac66520306feacc3754f4e4e.png',
    'wall': 'https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/054a8adeb39b923ec831d74a1385d84c90cbfb2b9c125ee28c213c25cf137a90.png',
}

OUT_DIR = '/app/frontend/public/assets/buildings'
os.makedirs(OUT_DIR, exist_ok=True)


def is_bg(p):
    r, g, b = p[0], p[1], p[2]
    return min(r, g, b) > 195 and (max(r, g, b) - min(r, g, b)) < 28


def process(name, url):
    path = f'/tmp/src_{name}.png'
    if not os.path.exists(path):
        urllib.request.urlretrieve(url, path)
    img = Image.open(path).convert('RGBA')
    w, h = img.size
    px = img.load()

    visited = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(px[x, y]) and not visited[y][x]:
                visited[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(px[x, y]) and not visited[y][x]:
                visited[y][x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx] and is_bg(px[nx, ny]):
                visited[ny][nx] = True
                q.append((nx, ny))

    # Global pass: remove remaining strictly-white enclosed pockets
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if p[3] == 255 and min(p[0], p[1], p[2]) > 205 and (max(p[0], p[1], p[2]) - min(p[0], p[1], p[2])) < 18:
                px[x, y] = (0, 0, 0, 0)

    # Feather edges: semi-transparent for bright pixels adjacent to transparency
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if p[3] == 255 and min(p[0], p[1], p[2]) > 175:
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                        px[x, y] = (p[0], p[1], p[2], 120)
                        break

    bbox = img.getbbox()
    img = img.crop(bbox)
    img.thumbnail((512, 512), Image.LANCZOS)
    out = os.path.join(OUT_DIR, f'{name}.png')
    img.save(out, optimize=True)
    print(f'OK {name}: {img.size}, {os.path.getsize(out)//1024}KB')


for name, url in URLS.items():
    try:
        process(name, url)
    except Exception as e:
        print(f'ERROR {name}: {e}')
