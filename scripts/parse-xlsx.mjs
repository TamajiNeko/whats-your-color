import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { processStudentRow } from '../src/config/studentParser.js';

try {
  const xlsxPath = path.resolve('xlsx/ENG 69.xlsx');
  const workbook = XLSX.readFile(xlsxPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet);

  const processed = rawRows.map(row => processStudentRow(row)).filter(Boolean);

  const dataDir = path.resolve('src/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dataDir, 'students.json'),
    JSON.stringify(processed, null, 2)
  );

  console.log(`Successfully parsed ${processed.length} students into src/data/students.json`);
} catch (error) {
  console.error('Error parsing XLSX file:', error);
  process.exit(1);
}
