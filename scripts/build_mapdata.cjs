/* Gera src/lib/mapData.js com geometria real de Portugal (distritos + municípios)
   a partir dos GeoJSON da CAOP. Executar: node scripts/build_mapdata.cjs */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'geo-'));
execSync(`cd ${WORK} && curl -sL -o continente.json https://raw.githubusercontent.com/nmota/caop_GeoJSON/master/ContinenteConcelhos.geojson && curl -sL -o madeira.json "https://raw.githubusercontent.com/nmota/caop_GeoJSON/master/Madeira/MadeiraConcelhos.geojson" && curl -sL -o acores_occ.json "https://raw.githubusercontent.com/nmota/caop_GeoJSON/master/A%C3%A7ores/A%C3%A7oresOcidentalConcelhos.geojson" && curl -sL -o acores_ctr.json "https://raw.githubusercontent.com/nmota/caop_GeoJSON/master/A%C3%A7ores/A%C3%A7oresCentralConcelhos.geojson" && curl -sL -o acores_ori.json "https://raw.githubusercontent.com/nmota/caop_GeoJSON/master/A%C3%A7ores/A%C3%A7oresOrientalConcelhos.geojson"`, { stdio: 'inherit', timeout: 300000 });

const pkg = path.join(WORK, 'package.json');
fs.writeFileSync(pkg, JSON.stringify({ name: 'geo-build', private: true }));
execSync(`cd ${WORK} && npm i --no-audit --no-fund polygon-clipping@0.15.0`, { stdio: 'inherit', timeout: 300000 });
const { union } = require(path.join(WORK, 'node_modules', 'polygon-clipping'));

const strip = s => s.replace(/^\uFEFF/, '');
const read = f => JSON.parse(strip(fs.readFileSync(path.join(WORK, f), 'utf8')));

function geomToPolygons(geom) {
  if (!geom) return [];
  if (geom.type === 'Polygon') return [geom.coordinates];
  if (geom.type === 'MultiPolygon') return geom.coordinates;
  return [];
}

function ringArea(ring) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1]);
  }
  return Math.abs(a / 2);
}

function simplifyRing(ring, tol) {
  const sqSegDist = (p, a, b) => {
    let x = a[0], y = a[1], dx = b[0] - x, dy = b[1] - y;
    if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) { x = b[0]; y = b[1]; }
      else if (t > 0) { x += dx * t; y += dy * t; }
    }
    dx = p[0] - x; dy = p[1] - y;
    return dx * dx + dy * dy;
  };
  const sqTol = tol * tol;
  const stack = [[0, ring.length - 1]];
  const keep = new Array(ring.length).fill(false);
  keep[0] = keep[ring.length - 1] = true;
  while (stack.length) {
    const [s, e] = stack.pop();
    if (e <= s + 1) continue;
    let maxD = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = sqSegDist(ring[i], ring[s], ring[e]);
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > sqTol && idx > 0) {
      stack.push([s, idx], [idx, e]);
      keep[idx] = true;
    }
  }
  return ring.filter((_, i) => keep[i]);
}

const keyOf = (p, patterns, fallback) => {
  for (const pat of patterns) {
    const k = Object.keys(p).find(kk => pat.test(kk));
    if (k) return p[k];
  }
  return fallback;
};

function processFile(file, region, utmZone) {
  const d = read(file);
  const byDistrict = {};
  const byConcelho = {};
  for (const feat of d.features) {
    const p = feat.properties || {};
    const district = (keyOf(p, [/^distrito$/i], region) || region).toString().trim();
    const concelho = (keyOf(p, [/^concelho$/i, /munic/i], '') || '').toString().trim();
    const island = (keyOf(p, [/ilha/i], null) || null);
    let polys = geomToPolygons(feat.geometry);
    // Ilhas usam UTM (y > 3M); continente usa PT-TM06
    const sampleY = polys[0] && polys[0][0] && polys[0][0][0] ? polys[0][0][0][1] : 0;
    const isUtm = sampleY > 3000000;
    const toLonLat = isUtm ? (x, y) => utmToLonLat(x, y, utmZone) : metersToLonLat;
    polys = polys.map(rings => rings.map(ring => ring.map(([x, y]) => toLonLat(x, y))));
    if (!concelho) continue;
    const ck = `${district}||${concelho}`;
    (byConcelho[ck] ||= { district, concelho, island, polys: [] }).polys.push(...polys);
    (byDistrict[district] ||= { district, island, polys: [] }).polys.push(...polys);
  }
  return { byDistrict, byConcelho };
}

// UTM norte — zona indicada explicitamente (ilhas: Madeira 28, Açores 26)
function utmToLonLat(x, y, zone) {
  const a = 6378137.0, f = 1 / 298.257222101;
  const k0 = 0.9996;
  const e2 = 2 * f - f * f;
  const ep2 = e2 / (1 - e2);
  const easting = x % 1000000;
  const lon0 = ((6 * zone - 183) * Math.PI) / 180;
  const M = y / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu)
    + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const sinp = Math.sin(phi1), cosp = Math.cos(phi1);
  const N1 = a / Math.sqrt(1 - e2 * sinp * sinp);
  const T1 = Math.tan(phi1) ** 2;
  const C1 = ep2 * cosp * cosp;
  const R1 = a * (1 - e2) / (1 - e2 * sinp * sinp) ** 1.5;
  const D = (easting - 500000) / (N1 * k0);  const lat = phi1 - (N1 * Math.tan(phi1) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
  const lon = lon0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / cosp;
  return [lon * 180 / Math.PI, lat * 180 / Math.PI];
}

// Projeção usada pela CAOP: Transverse Mercator (ETRS89 / PT-TM06)
function metersToLonLat(x, y) {  const a = 6378137.0, f = 1 / 298.257222101;
  const k0 = 1.0, lon0 = -8.13318 * Math.PI / 180, lat0 = 39.66826 * Math.PI / 180;
  const e2 = 2 * f - f * f;
  const ep2 = e2 / (1 - e2);
  const rad = Math.PI / 180;
  // Arco de meridiano (m) da origem de latitude até ao equador
  const meridianArc = (phi) => {
    const e4 = e2 * e2, e6 = e4 * e2, e8 = e6 * e2;
    return a * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi
      - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * phi)
      + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * phi)
      - (35 * e6 / 3072) * Math.sin(6 * phi));
  };
  const M = y + meridianArc(lat0);
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const phi1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + (151 * e1 ** 3 / 96) * Math.sin(6 * mu)
    + (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);
  const sinp = Math.sin(phi1), cosp = Math.cos(phi1);
  const N1 = a / Math.sqrt(1 - e2 * sinp * sinp);
  const T1 = Math.tan(phi1) ** 2;
  const C1 = ep2 * cosp * cosp;
  const R1 = a * (1 - e2) / (1 - e2 * sinp * sinp) ** 1.5;
  const D = x / (N1 * k0);
  const lat = phi1 - (N1 * Math.tan(phi1) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * D ** 6 / 720);
  const lon = lon0 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * D ** 5 / 120) / cosp;
  return [lon * 180 / Math.PI, lat * 180 / Math.PI];
}

const COLORS = {
  'VIANA DO CASTELO': '#e2711d', 'BRAGA': '#00bcd4', 'VILA REAL': '#7cb342',
  'BRAGANÇA': '#1976d2', 'PORTO': '#d32f2f', 'AVEIRO': '#f9a825',
  'VISEU': '#ba68c8', 'GUARDA': '#c2185b', 'COIMBRA': '#7cb342',
  'CASTELO BRANCO': '#d32f2f', 'LEIRIA': '#7cb342', 'SANTARÉM': '#ba68c8',
  'LISBOA': '#29b6f6', 'PORTALEGRE': '#f9a825', 'SETÚBAL': '#e2711d',
  'ÉVORA': '#1976d2', 'BEJA': '#7cb342', 'FARO': '#ef5350',
  'MADEIRA': '#c62828', 'AÇORES': '#4caf50',
};

const titleCase = s => s.toLowerCase()
  .replace(/(^|[\s'’-])(\S)/g, (m, a, b) => a + b.toUpperCase())
  .replace(/\bDe\b/g, 'de').replace(/\bDo\b/g, 'do').replace(/\bDa\b/g, 'da').replace(/\bDos\b/g, 'dos').replace(/\bDas\b/g, 'das').replace(/\bE\b/g, 'e');

const out = { districts: {}, municipalities: {} };
const TOL_DISTRICT = 0.0035;
const TOL_CONCELHO = 0.0022;
const MIN_AREA_D = 0.0015;
const MIN_AREA_C = 0.0006;

// Each region gets its own local frame; we place them manually on the canvas.
function buildRegion(file, region, frame, utmZone) {
  const { byDistrict, byConcelho } = processFile(file, region, utmZone);
  const { scale, lon0, lat0, dx, dy } = frame;
  const project = ([lon, lat]) => [
    Math.round(((lon - lon0) * scale + dx) * 100) / 100,
    Math.round(((lat0 - lat) * scale + dy) * 100) / 100
  ];
  const toPaths = (polys, tol, minArea) => {
    let u;
    try { u = union(polys); } catch { u = polys; }
    const paths = [];
    for (const poly of u || []) {
      for (const ring of poly) {
        if (ringArea(ring) < minArea) continue;
        const s = simplifyRing(ring, tol);
        if (s.length < 4) continue;
        paths.push(s.map(project));
      }
    }
    return paths;
  };
  for (const [name, obj] of Object.entries(byDistrict)) {
    const tc = name === 'AÇORES' ? 'Açores' : titleCase(name);
    out.districts[tc] = {
      region,
      color: COLORS[name.toUpperCase()] || '#90a4ae',
      paths: toPaths(obj.polys, TOL_DISTRICT, MIN_AREA_D),
    };
  }
  for (const obj of Object.values(byConcelho)) {
    const dTc = titleCase(obj.district);
    const cTc = titleCase(obj.concelho);
    out.municipalities[`${dTc}||${cTc}`] = {
      district: dTc,
      municipality: cTc,
      island: obj.island ? titleCase(obj.island.replace(/\s*\(AÇORES\)/i, '')) : null,
      paths: toPaths(obj.polys, TOL_CONCELHO, MIN_AREA_C),
    };
  }
}

// Frames: continente na posição real; ilhas reposicionadas em caixas à esquerda,
// como na imagem de referência (Açores topo-esquerda, Madeira meio-esquerda).
buildRegion('continente.json', 'continente', { scale: 120, lon0: -9.65, lat0: 42.25, dx: 0, dy: 0 }, null);
buildRegion('madeira.json', 'madeira', { scale: 320, lon0: -17.35, lat0: 33.16, dx: 60, dy: 660 }, 28);
buildRegion('acores_occ.json', 'acores', { scale: 300, lon0: -31.65, lat0: 39.55, dx: 40, dy: 90 }, 25);
buildRegion('acores_ctr.json', 'acores', { scale: 300, lon0: -28.85, lat0: 38.85, dx: 190, dy: 130 }, 26);
buildRegion('acores_ori.json', 'acores', { scale: 300, lon0: -25.95, lat0: 37.95, dx: 320, dy: 200 }, 26);

let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const d of Object.values(out.districts)) {
  for (const p of d.paths) for (const [x, y] of p) {
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
}
out.bounds = { minX, maxX, minY, maxY };

const dest = path.join(__dirname, '..', 'src', 'lib', 'mapData.js');
fs.writeFileSync(dest, 'export const MAP_DATA = ' + JSON.stringify(out) + ';\n');
console.log('OK districts:', Object.keys(out.districts).length, 'municipalities:', Object.keys(out.municipalities).length, 'size:', fs.statSync(dest).size);
