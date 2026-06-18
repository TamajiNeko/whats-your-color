const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const filePath = path.join(__dirname, '..', 'public', 'data.xlsx');
try {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet);
  
  const processedData = rawData.map(row => {
    const studentId = String(row['รหัสนักศึกษา']).trim();
    const title = String(row['คำนำหน้า']).trim();
    const firstName = String(row['ชื่อ']).trim();
    const lastName = String(row['นามสกุล']).trim();
    const colorThai = String(row['สี']).trim();
    
    let gender = 'm';
    if (title === 'นางสาว' || title === 'นาง') {
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
  });
  
  const outputDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'students.json'),
    JSON.stringify(processedData, null, 2),
    'utf-8'
  );
  
  console.log(`[XLSX Sync] Successfully parsed public/data.xlsx and updated src/data/students.json (${processedData.length} records)`);
} catch (err) {
  console.error('[XLSX Sync] Error:', err);
}
