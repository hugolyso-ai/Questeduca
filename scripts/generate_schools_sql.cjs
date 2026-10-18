const fs = require('fs');
const XLSX = require('xlsx');

// IDs já usados pela seed original (001_core_tables) — não podem ser reutilizados
// para escolas diferentes, senão o upsert substitui escolas públicas por privadas.
const RESERVED_IDS = new Set(['aco001','aco002','aco003','aco004','ave001','ave002','ave003','ave004','ave005','ave006','ave007','ave008','bej001','bej002','bej003','bgc001','bgc002','bgc003','brg001','brg002','brg003','brg004','brg005','brg006','brg007','brg008','cas001','cas002','cas003','cas004','cas005','coi001','coi002','coi003','coi004','coi005','coi006','coi007','coi008','coi009','coi010','evo001','evo002','evo003','evo004','far001','far002','far003','far004','far005','far006','gua001','gua002','gua003','gua004','gua005','lei001','lei002','lei003','lei004','lei005','lei006','lei007','lei008','lis001','lis002','lis003','lis004','lis005','lis006','lis007','lis008','lis009','lis010','lis011','lis012','lis013','lis014','lis015','lis016','lis017','lis018','lis019','lis020','lis021','lis022','lis023','lis024','lis025','lis026','lis027','lis028','lis029','lis030','lis031','lis032','lis033','lis034','lis035','lis036','lis037','lis038','lis039','lis040','lis041','lis042','lis043','lis044','lis045','lis046','lis047','lis048','lis049','lis050','mad001','mad002','mad003','mad004','por001','por002','por003','por004','por005','por006','por007','por008','por009','por010','por011','por012','por013','por014','por015','por016','por017','por018','por019','por020','ptg001','ptg002','ptg003','ptg004','san001','san002','san003','san004','san005','san006','san007','san008','set001','set002','set003','set004','set005','set006','set007','set008','via001','via002','via003','via004','via005','vis001','vis002','vis003','vis004','vlr001','vlr002','vlr003','vlr004','vlr005']);

const files = [
  ['1', 'data/schools/1_ciclo/1_ciclo.xlsx'],
  ['2', 'data/schools/2_ciclo/2_ciclo.xlsx'],
  ['3', 'data/schools/3_ciclo/3_ciclo.xlsx'],
];

const distritoSlug = { 'viana do castelo':'vca','braga':'brg','vila real':'vrl','bragança':'brn','porto':'pto','aveiro':'ave','viseu':'vis','guarda':'gua','coimbra':'cob','castelo branco':'ctb','leiria':'lei','santarém':'str','lisboa':'lsb','setúbal':'stb','portalegre':'ptg','évora':'evr','beja':'bja','faro':'fro','açores':'aco','madeira':'mad' };
const validDistricts = Object.keys(distritoSlug);
const districtByNorm = new Map(validDistricts.map(d => [d.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), d]));

const esc = (s) => "'" + s.replace(/'/g, "''") + "'";
const titleCase = (s) => s.toLowerCase().split(' ').map(w => (/^(de|do|da|das|dos|e)$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ').replace(/\(([a-záâãàéêíóôõúç])/g, (m, c) => '(' + c.toUpperCase());

const seen = new Map(); // key -> {name, locality, municipality, district, cycles:Set}
const districts = new Set();
const localities = new Set();
const stats = { rows: 0, skipped: 0, dupInFile: 0, merged: 0 };

for (const [ciclo, path] of files) {
  const wb = XLSX.readFile(path, { cellDates: false });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
  for (let i = 1; i < rows.length; i++) {
    const [nome, localidadeRaw, , distritoRaw] = rows[i].map(v => String(v || '').trim());
    stats.rows++;
    const concelho = titleCase((rows[i][2] || '').trim().replace(/\s+/g, ' '));
    if (!nome || !concelho) { stats.skipped++; continue; }
    const distrito = distritoRaw.toLowerCase();
    const distritoFixed = distrito === 'lisboa' ? 'Lisboa'
      : (/^ilha/.test(distrito) ? (/madeira/.test(distrito) ? 'Madeira' : 'Açores')
      : (districtByNorm.get(distrito.normalize('NFD').replace(/[\u0300-\u036f]/g, '')) && titleCase(districtByNorm.get(distrito.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))));
    if (!distritoFixed) { console.error('UNKNOWN DISTRICT row ' + (i+1) + ' in ' + path + ': ' + JSON.stringify(rows[i])); stats.skipped++; continue; }
    const localidade = titleCase((localidadeRaw || '').replace(/\s+/g, ' '));
    if (localidade) localities.add(localidade);
    districts.add(distritoFixed);
    const key = distritoFixed + '|' + concelho + '|' + localidade + '|' + nome.toLowerCase();
    if (seen.has(key)) {
      const cur = seen.get(key);
      if (!cur.cycles.has(ciclo)) { cur.cycles.add(ciclo); stats.merged++; }
      else stats.dupInFile++;
    } else {
      seen.set(key, { nome, localidade, concelho, distrito: distritoFixed, cycles: new Set([ciclo]) });
    }
  }
}

const schools = [...seen.values()];
const usedIds = new Set();
const counters = {};
const lines = schools.map(s => {
  const base = distritoSlug[s.distrito.toLowerCase()];
  counters[base] = (counters[base] || 0) + 1;
  let id = base + String(counters[base]).padStart(3, '0');
  while (usedIds.has(id) || RESERVED_IDS.has(id)) { counters[base]++; id = base + String(counters[base]).padStart(3, '0'); }
  usedIds.add(id);
  return `  (${esc(id)}, ${esc(s.nome)}, ${esc(s.distrito)}, ${esc(s.concelho)}, ${s.localidade ? esc(s.localidade) : 'NULL'}, ARRAY['${[...s.cycles].sort().join("','")}']::text[])`;
});

console.log('STATS', JSON.stringify(stats));
console.log('unique schools:', schools.length);
console.log('districts:', [...districts].join(', '));
console.log('localities:', localities.size);

fs.writeFileSync('/tmp/schools_data.sql', lines.join(',\n'));
console.log('wrote /tmp/schools_data.sql');
