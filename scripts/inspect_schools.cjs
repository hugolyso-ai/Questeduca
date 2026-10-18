const XLSX = require('xlsx');
const files = [
  'data/schools/1_ciclo/1_ciclo.xlsx',
  'data/schools/2_ciclo/2_ciclo.xlsx',
  'data/schools/3_ciclo/3_ciclo.xlsx',
];
for (const f of files) {
  const wb = XLSX.readFile(f, { cellDates: false });
  console.log('=== ' + f + ' | sheets: ' + wb.SheetNames.join(', '));
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  console.log('total rows: ' + rows.length);
  for (let i = 0; i < Math.min(6, rows.length); i++) console.log(JSON.stringify(rows[i]));
}
