import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { processStudentRow } from '@/config/studentParser';

// Force dynamic execution
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    const xlsxPath = path.resolve(process.cwd(), 'xlsx/data.xlsx');
    const fileBuffer = fs.readFileSync(xlsxPath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet);

    const students = rawRows.map(row => processStudentRow(row)).filter(Boolean);

    if (id) {
      const student = students.find(s => s.studentId === id);
      return NextResponse.json(student || null, {
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate'
        }
      });
    }

    return NextResponse.json(students, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  } catch (error) {
    console.error('[API Students] Error processing Excel file:', error);
    return NextResponse.json(id ? null : [], {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  }
}
