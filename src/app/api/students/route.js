import { NextResponse } from 'next/server';
import { list, get } from '@vercel/blob';

// Force dynamic execution since we are reading from Vercel Blob dynamically
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (token) {
    try {
      const { blobs } = await list({ token });
      const activeStudentsBlob = blobs.find(b => b.pathname === 'active-students.json');
      
      if (activeStudentsBlob) {
        const cacheBuster = new Date(activeStudentsBlob.uploadedAt).getTime();
        const { stream } = await get(`${activeStudentsBlob.url}?t=${cacheBuster}`, { access: 'private', token });
        const response = new Response(stream);
        const students = await response.json();
        
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
      }
    } catch (error) {
      console.error('[API Students] Error fetching from Vercel Blob:', error);
    }
  }

  // Return empty array or null if not configured or empty
  return NextResponse.json(id ? null : [], {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate'
    }
  });
}
