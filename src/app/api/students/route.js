import { NextResponse } from 'next/server';
import students from '@/data/students.json';

// Force dynamic execution since we use searchParams
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
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
    console.error('[API Students] Error processing students:', error);
    return NextResponse.json(id ? null : [], {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate'
      }
    });
  }
}
