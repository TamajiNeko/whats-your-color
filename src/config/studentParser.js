/**
 * Processes a raw spreadsheet row into the structured student format.
 * Matches the logic in scripts/parse-xlsx.js.
 */
export function processStudentRow(row) {
  // Extract fields and handle potential field name variations
  const studentId = String(row['รหัสนักศึกษา'] || row['studentId'] || '').trim();
  const title = String(row['คำนำหน้า'] || row['title'] || '').trim();
  const firstName = String(row['ชื่อ'] || row['firstName'] || '').trim();
  const lastName = String(row['นามสกุล'] || row['lastName'] || '').trim();
  const colorThai = String(row['สี'] || row['colorThai'] || '').trim();
  
  if (!studentId) return null; // skip invalid or empty rows
  
  let gender = 'm';
  if (title === 'นางสาว' || title === 'นาง' || title.toLowerCase() === 'f' || title.toLowerCase() === 'female') {
    gender = 'f';
  }
  
  let colorEng = 'purple';
  let colorHex = '#a855f7';
  let colorNameEng = 'Purple';
  
  switch (colorThai) {
    case 'ดำ':
      colorEng = 'black';
      colorHex = '#1e293b';
      colorNameEng = 'Black';
      break;
    case 'น้ำเงิน':
      colorEng = 'blue';
      colorHex = '#1d4ed8';
      colorNameEng = 'Blue';
      break;
    case 'น้ำตาล':
      colorEng = 'brown';
      colorHex = '#78350f';
      colorNameEng = 'Brown';
      break;
    case 'เขียว':
      colorEng = 'green';
      colorHex = '#15803d';
      colorNameEng = 'Green';
      break;
    case 'ส้ม':
      colorEng = 'orange';
      colorHex = '#ea580c';
      colorNameEng = 'Orange';
      break;
    case 'ชมพู':
      colorEng = 'pink';
      colorHex = '#db2777';
      colorNameEng = 'Pink';
      break;
    case 'ม่วง':
      colorEng = 'purple';
      colorHex = '#a855f7';
      colorNameEng = 'Purple';
      break;
    case 'แดง':
      colorEng = 'red';
      colorHex = '#dc2626';
      colorNameEng = 'Red';
      break;
    case 'ฟ้า':
      colorEng = 'sky_blue';
      colorHex = '#0284c7';
      colorNameEng = 'Sky Blue';
      break;
    case 'เหลือง':
      colorEng = 'yellow';
      colorHex = '#eab308';
      colorNameEng = 'Yellow';
      break;
    default:
      // Fallback for English values
      const lowerColor = colorThai.toLowerCase();
      if (['black', 'dark'].includes(lowerColor)) {
        colorEng = 'black'; colorHex = '#1e293b'; colorNameEng = 'Black';
      } else if (['blue', 'darkblue'].includes(lowerColor)) {
        colorEng = 'blue'; colorHex = '#1d4ed8'; colorNameEng = 'Blue';
      } else if (['brown'].includes(lowerColor)) {
        colorEng = 'brown'; colorHex = '#78350f'; colorNameEng = 'Brown';
      } else if (['green'].includes(lowerColor)) {
        colorEng = 'green'; colorHex = '#15803d'; colorNameEng = 'Green';
      } else if (['orange'].includes(lowerColor)) {
        colorEng = 'orange'; colorHex = '#ea580c'; colorNameEng = 'Orange';
      } else if (['pink'].includes(lowerColor)) {
        colorEng = 'pink'; colorHex = '#db2777'; colorNameEng = 'Pink';
      } else if (['purple'].includes(lowerColor)) {
        colorEng = 'purple'; colorHex = '#a855f7'; colorNameEng = 'Purple';
      } else if (['red'].includes(lowerColor)) {
        colorEng = 'red'; colorHex = '#dc2626'; colorNameEng = 'Red';
      } else if (['sky_blue', 'skyblue', 'lightblue', 'sky'].includes(lowerColor)) {
        colorEng = 'sky_blue'; colorHex = '#0284c7'; colorNameEng = 'Sky Blue';
      } else if (['yellow'].includes(lowerColor)) {
        colorEng = 'yellow'; colorHex = '#eab308'; colorNameEng = 'Yellow';
      }
      break;
  }
  
  const profilePic = `/profiles/${colorEng}_${gender}.png`;
  
  return {
    studentId,
    title,
    firstName,
    lastName,
    colorThai,
    colorEng,
    colorHex,
    colorNameEng,
    gender,
    profilePic
  };
}

/**
 * Validates that the dataset contains the necessary columns.
 */
export function validateStudentColumns(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { valid: false, error: 'File is empty or not an array' };
  }
  
  const sampleRow = rows[0];
  const requiredKeys = ['รหัสนักศึกษา', 'คำนำหน้า', 'ชื่อ', 'นามสกุล', 'สี'];
  const missingKeys = [];
  
  for (const key of requiredKeys) {
    // Check if the key exists directly or with fallback name
    const hasKey = Object.keys(sampleRow).some(k => k.trim() === key || k.trim().toLowerCase() === key.toLowerCase());
    if (!hasKey) {
      missingKeys.push(key);
    }
  }
  
  if (missingKeys.length > 0) {
    return {
      valid: false,
      error: `Missing required column headers: ${missingKeys.join(', ')}. Please use: รหัสนักศึกษา, คำนำหน้า, ชื่อ, นามสกุล, สี`
    };
  }
  
  return { valid: true };
}
