"""Regenerate building sprites on solid magenta background, then chroma-key to transparency."""
import asyncio
import os
import base64
import sys
from collections import deque
from dotenv import load_dotenv
from PIL import Image

load_dotenv('/app/backend/.env')
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

OUT_DIR = '/app/frontend/public/assets/buildings'
NAMES = ['town_hall', 'house', 'barracks', 'farm', 'market', 'school', 'library',
         'lumber_mill', 'quarry', 'mine', 'garden', 'wall']

PROMPT = (
    "Recreate this exact building as an isolated isometric video game sprite (Age of Empires 2 style). "
    "Keep the same architecture, colors and painterly style. The building must sit on a small natural grass/dirt "
    "base patch that follows the building footprint. EVERYTHING else — every single pixel not belonging to the "
    "building or its small base — must be SOLID UNIFORM MAGENTA color #FF00FF. "
    "No checkerboard pattern, no white background, no gray background, no sky, no cast shadows outside the base, "
    "no text, no borders. Just the building sprite on flat magenta."
)


def is_magenta(p):
    r, g, b = p[0], p[1], p[2]
    return r > 150 and b > 150 and g < 110 and abs(r - b) < 80


def chroma_key(src_path, out_path):
    img = Image.open(src_path).convert('RGBA')
    w, h = img.size
    px = img.load()
    # Flood fill from edges over magenta
    visited = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_magenta(px[x, y]):
                visited[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_magenta(px[x, y]) and not visited[y][x]:
                visited[y][x] = True
                q.append((x, y))
    while q:
        x, y = q.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx] and is_magenta(px[nx, ny]):
                visited[ny][nx] = True
                q.append((nx, ny))
    # Global magenta cleanup (enclosed pockets)
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 255 and is_magenta(px[x, y]):
                px[x, y] = (0, 0, 0, 0)
    # Despill: edge pixels with magenta tint -> neutralize + feather
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if p[3] == 0:
                continue
            adjacent_clear = any(
                0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))
            )
            if adjacent_clear:
                r, g, b, a = p
                if r > g and b > g:  # magenta tint
                    m = (r + b) // 2
                    px[x, y] = (g, g, g, 100) if m - g > 60 else (r, g, b, 160)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.thumbnail((512, 512), Image.LANCZOS)
    img.save(out_path, optimize=True)
    return img.size


async def gen(name):
    src = f'/tmp/src_{name}.png'
    with open(src, 'rb') as f:
        ref_b64 = base64.b64encode(f.read()).decode('utf-8')
    api_key = os.getenv('EMERGENT_LLM_KEY')
    chat = LlmChat(api_key=api_key, session_id=f"sprite-{name}", system_message="You are a game sprite artist")
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
    msg = UserMessage(text=PROMPT, file_contents=[ImageContent(ref_b64)])
    text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        print(f"FAIL {name}: no image. {str(text)[:120]}")
        return
    raw = f'/tmp/magenta_{name}.png'
    with open(raw, 'wb') as f:
        f.write(base64.b64decode(images[0]['data']))
    size = chroma_key(raw, os.path.join(OUT_DIR, f'{name}.png'))
    print(f"OK {name}: {size}")


async def main():
    names = sys.argv[1:] if len(sys.argv) > 1 else NAMES
    for name in names:
        try:
            await gen(name)
        except Exception as e:
            print(f"ERROR {name}: {e}")

asyncio.run(main())
