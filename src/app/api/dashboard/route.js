import { NextResponse } from 'next/server';
import { put, list, del, get } from '@vercel/blob';
import * as XLSX from 'xlsx';
import { processStudentRow, validateStudentColumns } from '@/config/studentParser';

export const dynamic = 'force-dynamic';

async function getNextAvailableFilename(originalName, token) {
  // Extract base name and extension
  const match = originalName.match(/^(.*)\.xlsx$/i);
  const baseName = match ? match[1] : originalName;
  const ext = '.xlsx';

  // Strip any trailing (number) from the base name to find the true original name
  const baseMatch = baseName.match(/^(.*?)(?:\s*\(\d+\))?$/);
  const cleanBaseName = baseMatch ? baseMatch[1].trim() : baseName;

  // List existing files in the spreadsheets/ folder
  const { blobs } = await list({ token });
  const existingNames = blobs
    .filter(b => b.pathname.startsWith('spreadsheets/'))
    .map(b => b.pathname.replace('spreadsheets/', '').toLowerCase());

  // Check if cleanBaseName + ext exists
  let candidateName = `${cleanBaseName}${ext}`;
  if (!existingNames.includes(candidateName.toLowerCase())) {
    return candidateName;
  }

  // If it exists, find the next available number (1, 2, ...)
  let counter = 1;
  while (true) {
    candidateName = `${cleanBaseName}(${counter})${ext}`;
    if (!existingNames.includes(candidateName.toLowerCase())) {
      return candidateName;
    }
    counter++;
  }
}

function verifyPin(request) {
  const pin = request.headers.get('x-dashboard-pin');
  const correctPin = process.env.DASHBOARD_PIN;
  return correctPin && pin === correctPin;
}

export async function GET(request) {
  if (!verifyPin(request)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing PIN' }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is not configured.' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get('url');

  try {
    if (urlParam) {
      try {
        const busterUrl = urlParam.includes('?') ? `${urlParam}&t=${Date.now()}` : `${urlParam}?t=${Date.now()}`;
        const result = await get(busterUrl, { access: 'private', token });
        if (!result) {
          return NextResponse.json({ error: 'Selected spreadsheet could not be found. It may have been deleted.' }, { status: 404 });
        }
        const { stream } = result;
        const response = new Response(stream);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        return NextResponse.json({ rows });
      } catch (err) {
        console.error('[API Dashboard GET] Failed to fetch or parse spreadsheet URL:', err);
        return NextResponse.json({ error: 'Selected spreadsheet could not be loaded. It may have been deleted.' }, { status: 404 });
      }
    }

    // 2. Otherwise, return the list of spreadsheets and the active configuration
    const { blobs } = await list({ token });
    
    // Find all files in the spreadsheets/ directory
    const spreadsheets = blobs
      .filter(b => b.pathname.startsWith('spreadsheets/'))
      .map(b => ({
        name: b.pathname.replace('spreadsheets/', ''),
        url: b.url,
        size: b.size,
        uploadedAt: b.uploadedAt
      }))
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)); // Newest first

    // Fetch the active config
    let activeConfig = null;
    const activeConfigBlob = blobs.find(b => b.pathname === 'active-config.json');
    if (activeConfigBlob) {
      try {
        const cacheBuster = new Date(activeConfigBlob.uploadedAt).getTime();
        const { stream } = await get(`${activeConfigBlob.url}?t=${cacheBuster}`, { access: 'private', token });
        const configResponse = new Response(stream);
        activeConfig = await configResponse.json();
      } catch (err) {
        console.error('Failed to parse active-config.json:', err);
      }
    }

    // Verify that the active spreadsheet still exists in Blob storage
    const activeFileExists = activeConfig && spreadsheets.some(s => s.url === activeConfig.activeUrl);
    
    if (activeConfig && !activeFileExists) {
      // The active file was deleted/missing. Auto-rotate or clear it!
      if (spreadsheets.length > 0) {
        activeConfig = {
          activeUrl: spreadsheets[0].url,
          activeName: spreadsheets[0].name
        };
        // Update active-config.json
        await put('active-config.json', JSON.stringify(activeConfig), {
          access: 'private',
          contentType: 'application/json',
          addRandomSuffix: false,
          allowOverwrite: true,
          token
        });
        // Update active-students.json with the new active sheet's data
        try {
          const { stream } = await get(spreadsheets[0].url, { access: 'private', token });
          const response = new Response(stream);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rawRows = XLSX.utils.sheet_to_json(sheet);
          const processed = rawRows.map(row => processStudentRow(row)).filter(Boolean);
          await put('active-students.json', JSON.stringify(processed), {
            access: 'private',
            contentType: 'application/json',
            addRandomSuffix: false,
            allowOverwrite: true,
            token
          });
        } catch (err) {
          console.error('Failed to parse next active sheet during auto-rotation:', err);
        }
      } else {
        // No spreadsheets left! Clear both configurations
        activeConfig = null;
        if (activeConfigBlob) {
          await del(activeConfigBlob.url, { token });
        }
        const activeStudentsBlob = blobs.find(b => b.pathname === 'active-students.json');
        if (activeStudentsBlob) {
          await del(activeStudentsBlob.url, { token });
        }
      }
    } else if (!activeConfig && spreadsheets.length > 0) {
      // If activeConfig was missing entirely but spreadsheets exist, auto-activate
      activeConfig = {
        activeUrl: spreadsheets[0].url,
        activeName: spreadsheets[0].name
      };
      await put('active-config.json', JSON.stringify(activeConfig), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        token
      });
    }

    return NextResponse.json({
      spreadsheets,
      activeConfig
    });
  } catch (error) {
    console.error('[API Dashboard GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Manage actions (upload, select, save, delete)
export async function POST(request) {
  if (!verifyPin(request)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing PIN' }, { status: 401 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'BLOB_READ_WRITE_TOKEN is not configured.' }, { status: 400 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Case 1: File upload (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Parse and validate workbook
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet);

      const validation = validateStudentColumns(rawRows);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Clean/sanitize name but preserve letters, numbers, spaces, dots, dashes, parentheses
      const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.\s()_-]/g, '_');
      const filename = await getNextAvailableFilename(sanitizedOriginalName, token);
      const excelBlob = await put(`spreadsheets/${filename}`, buffer, {
        access: 'private',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        addRandomSuffix: false,
        allowOverwrite: true,
        token
      });

      // Transform rows and upload active-students.json (overwrite)
      const processed = rawRows.map(row => processStudentRow(row)).filter(Boolean);
      await put('active-students.json', JSON.stringify(processed), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        token
      });

      // Update active-config.json (overwrite)
      const activeConfig = {
        activeUrl: excelBlob.url,
        activeName: filename
      };
      await put('active-config.json', JSON.stringify(activeConfig), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        token
      });

      return NextResponse.json({ success: true, activeConfig });
    }

    // Case 2: JSON payload commands (select, save, delete)
    const body = await request.json();
    const { action } = body;

    if (action === 'select') {
      const { url, name } = body;
      if (!url || !name) {
        return NextResponse.json({ error: 'Missing url or name' }, { status: 400 });
      }

      // Fetch and parse the selected spreadsheet
      const { stream } = await get(url, { access: 'private', token });
      const response = new Response(stream);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet);

      // Re-validate just in case
      const validation = validateStudentColumns(rawRows);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Transform rows and update active-students.json
      const processed = rawRows.map(row => processStudentRow(row)).filter(Boolean);
      await put('active-students.json', JSON.stringify(processed), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        token
      });

      // Update active config
      const activeConfig = { activeUrl: url, activeName: name };
      await put('active-config.json', JSON.stringify(activeConfig), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        token
      });

      return NextResponse.json({ success: true, activeConfig });
    }

    if (action === 'save') {
      const { rows } = body;
      if (!rows || !Array.isArray(rows)) {
        return NextResponse.json({ error: 'Missing rows array' }, { status: 400 });
      }

      // Re-validate columns from the client rows
      const validation = validateStudentColumns(rows);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      // Generate workbook buffer
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Overwrite the existing spreadsheet file (does not create new version)
      const { filename: originalFilename } = body;
      const filename = originalFilename ? originalFilename : 'edited.xlsx';
      const excelBlob = await put(`spreadsheets/${filename}`, buffer, {
        access: 'private',
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        addRandomSuffix: false,
        allowOverwrite: true,
        token
      });

      // Process and save active-students.json
      const processed = rows.map(row => processStudentRow(row)).filter(Boolean);
      await put('active-students.json', JSON.stringify(processed), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        token
      });

      // Update active config
      const activeConfig = {
        activeUrl: excelBlob.url,
        activeName: filename
      };
      await put('active-config.json', JSON.stringify(activeConfig), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        token
      });

      return NextResponse.json({ success: true, activeConfig });
    }

    if (action === 'delete') {
      const { url } = body;
      if (!url) {
        return NextResponse.json({ error: 'Missing url' }, { status: 400 });
      }

      // 1. Delete from Vercel Blob
      await del(url, { token });

      // 2. Check if the deleted file was the active one
      const { blobs } = await list({ token });
      let activeConfig = null;
      const activeConfigBlob = blobs.find(b => b.pathname === 'active-config.json');
      if (activeConfigBlob) {
        try {
          const cacheBuster = new Date(activeConfigBlob.uploadedAt).getTime();
          const { stream } = await get(`${activeConfigBlob.url}?t=${cacheBuster}`, { access: 'private', token });
          const configResponse = new Response(stream);
          activeConfig = await configResponse.json();
        } catch (err) {
          console.error('Failed to parse active-config.json:', err);
        }
      }

      if (activeConfig && activeConfig.activeUrl === url) {
        // The deleted spreadsheet was active. Find the next latest spreadsheet.
        const spreadsheets = blobs
          .filter(b => b.pathname.startsWith('spreadsheets/') && b.url !== url)
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        if (spreadsheets.length > 0) {
          // Set the next latest spreadsheet as active
          const nextActive = {
            activeUrl: spreadsheets[0].url,
            activeName: spreadsheets[0].pathname.replace('spreadsheets/', '')
          };
          await put('active-config.json', JSON.stringify(nextActive), {
            access: 'private',
            contentType: 'application/json',
            addRandomSuffix: false,
            allowOverwrite: true,
            token
          });

          // Parse and write its rows to active-students.json
          try {
            const { stream } = await get(spreadsheets[0].url, { access: 'private', token });
            const response = new Response(stream);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json(sheet);
            const processed = rawRows.map(row => processStudentRow(row)).filter(Boolean);
            await put('active-students.json', JSON.stringify(processed), {
              access: 'private',
              contentType: 'application/json',
              addRandomSuffix: false,
              allowOverwrite: true,
              token
            });
          } catch (err) {
            console.error('Failed to parse next active sheet during deletion fallback:', err);
          }
        } else {
          // No spreadsheets left in history! Clear active configuration and dynamic active-students list
          if (activeConfigBlob) {
            await del(activeConfigBlob.url, { token });
          }
          const activeStudentsBlob = blobs.find(b => b.pathname === 'active-students.json');
          if (activeStudentsBlob) {
            await del(activeStudentsBlob.url, { token });
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[API Dashboard POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
