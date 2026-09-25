/**
 * ====================================================================
 * APAAR Student Monitoring Dashboard - Dantewada District
 * Google Apps Script (Code.gs)
 * ====================================================================
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet containing the APAAR student data.
 * 2. Click on "Extensions" (एक्सटेंशन) -> "Apps Script".
 * 3. Delete any default code in Code.gs and paste this entire code.
 * 4. Click "Save" (Ctrl + S).
 * 5. Click "Deploy" (डिप्लॉय) -> "New deployment" (नया डिप्लॉयमेंट).
 * 6. Click the gear icon (Select type) -> Select "Web app".
 * 7. Set:
 *    - Description: APAAR Live API
 *    - Execute as: Me (your email)
 *    - Who has access: Anyone (कोई भी)
 * 8. Click "Deploy", authorize permissions, and copy the Web App URL.
 * 9. Paste this URL in your APAAR Dashboard to sync data in real time!
 */

// 1. GET Request: Fetches all students from the Google Sheet
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Check available sheets in priority order
    let sheet = ss.getSheetByName("APAAR Pending Status Report") || 
                ss.getSheetByName("APAAR Pending Status Report (2)") || 
                ss.getSheets()[0];
    
    const range = sheet.getDataRange();
    const values = range.getValues();
    
    if (!values || values.length <= 1) {
      return createJsonResponse({ status: 'error', message: 'No data found in sheet' });
    }
    
    // Determine headers from row 0
    const rawHeaders = values[0].map(h => String(h).trim());
    
    // Check if row 1 is a numbering row like (1), (2), (13)...
    let startRowIndex = 1;
    if (values.length > 2 && String(values[1][0]).includes('(')) {
      startRowIndex = 2;
    }
    
    // Helper to find column index case-insensitively
    function findCol(keywords) {
      // First pass: exact header match
      for (let k = 0; k < keywords.length; k++) {
        const kw = keywords[k].toLowerCase();
        for (let i = 0; i < rawHeaders.length; i++) {
          if (rawHeaders[i].toLowerCase() === kw) return i;
        }
      }
      // Second pass: substring match with exclusions
      for (let k = 0; k < keywords.length; k++) {
        const kw = keywords[k].toLowerCase();
        for (let i = 0; i < rawHeaders.length; i++) {
          const h = rawHeaders[i].toLowerCase();
          if (kw === 'name' && (h.includes('state') || h.includes('district') || h.includes('block') || h.includes('school'))) {
            continue;
          }
          if (h.indexOf(kw) !== -1) return i;
        }
      }
      return -1;
    }
    
    const colStateName = findCol(['state name']);
    const colStateCode = findCol(['state code']);
    const colDistrictName = findCol(['district name']);
    const colDistrictCode = findCol(['district code']);
    const colBlockName = findCol(['block name']);
    const colBlockCode = findCol(['block code']);
    const colSchoolName = findCol(['school name']);
    const colUdiseCode = findCol(['udise code', 'udise']);
    const colSchoolMgmt = findCol(['management']);
    const colSchoolCat = findCol(['category']);
    const colClass = findCol(['class']);
    const colSection = findCol(['section']);
    const colPen = findCol(['student pen', 'pen']);
    const colName = findCol(['student name', 'name']);
    const colAadhaarProv = findCol(['provided']);
    const colAadhaarVer = findCol(['verified']);
    const colReason = findCol(['reason']);
    const colApaarStatus = findCol(['apaar status', 'status']);
    
    const students = [];
    
    for (let r = startRowIndex; r < values.length; r++) {
      const row = values[r];
      
      // Get Student PEN safely (handle numeric or scientific notation format)
      let pen = colPen !== -1 ? row[colPen] : '';
      if (typeof pen === 'number') {
        pen = pen.toLocaleString('fullwide', { useGrouping: false });
      } else {
        pen = String(pen).trim();
      }
      
      // Skip empty PEN or header rows
      if (!pen || pen.length < 5 || pen.indexOf('(') !== -1) {
        continue;
      }
      
      let name = colName !== -1 ? String(row[colName]).trim() : '';
      let udise = colUdiseCode !== -1 ? row[colUdiseCode] : '';
      if (typeof udise === 'number') {
        udise = udise.toLocaleString('fullwide', { useGrouping: false });
      } else {
        udise = String(udise).trim();
      }
      
      let block = colBlockName !== -1 ? String(row[colBlockName]).trim().toUpperCase() : 'DANTEWADA';
      let school = colSchoolName !== -1 ? String(row[colSchoolName]).trim() : '';
      let cls = colClass !== -1 ? String(row[colClass]).trim() : '';
      let sec = colSection !== -1 ? String(row[colSection]).trim() : 'A';
      
      let prov = colAadhaarProv !== -1 ? String(row[colAadhaarProv]).trim().toUpperCase() : 'NO';
      let ver = colAadhaarVer !== -1 ? String(row[colAadhaarVer]).trim().toUpperCase() : 'NO';
      let reason = colReason !== -1 ? String(row[colReason]).trim() : 'Not Applied';
      
      let apaarStatus = 'Pending';
      if (colApaarStatus !== -1 && String(row[colApaarStatus]).toUpperCase().indexOf('GEN') !== -1) {
        apaarStatus = 'Generated';
      }
      
      students.push({
        id: r,
        stateName: colStateName !== -1 ? String(row[colStateName]).trim() : 'CHHATTISGARH',
        stateCode: colStateCode !== -1 ? String(row[colStateCode]).trim() : '22',
        districtName: colDistrictName !== -1 ? String(row[colDistrictName]).trim().toUpperCase() : 'DANTEWADA',
        districtCode: colDistrictCode !== -1 ? String(row[colDistrictCode]).trim() : '2216',
        blockName: block,
        blockCode: colBlockCode !== -1 ? String(row[colBlockCode]).trim() : '',
        schoolName: school,
        udiseCode: udise,
        schoolManagement: colSchoolMgmt !== -1 ? row[colSchoolMgmt] : '',
        schoolCategory: colSchoolCat !== -1 ? row[colSchoolCat] : '',
        className: cls,
        section: sec,
        studentPen: pen,
        studentName: name,
        isAadhaarProvided: prov === 'YES' ? 'YES' : 'NO',
        isAadhaarVerified: ver === 'YES' ? 'YES' : 'NO',
        apaarStatus: apaarStatus,
        pendingReason: reason || 'Not Applied'
      });
    }
    
    return createJsonResponse({
      status: 'success',
      sheetName: sheet.getName(),
      total: students.length,
      updatedAt: new Date().toISOString(),
      students: students
    });
    
  } catch (error) {
    return createJsonResponse({
      status: 'error',
      message: error.toString()
    });
  }
}

// 2. POST Request: Updates a student's verification or APAAR status in the sheet
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const penToUpdate = String(postData.studentPen).trim();
    
    if (!penToUpdate) {
      return createJsonResponse({ status: 'error', message: 'Missing studentPen' });
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("APAAR Pending Status Report") || 
                ss.getSheetByName("APAAR Pending Status Report (2)") || 
                ss.getSheets()[0];
                
    const values = sheet.getDataRange().getValues();
    const rawHeaders = values[0].map(h => String(h).trim().toLowerCase());
    
    const colPen = rawHeaders.findIndex(h => h.includes('pen'));
    const colVer = rawHeaders.findIndex(h => h.includes('verified'));
    const colProv = rawHeaders.findIndex(h => h.includes('provided'));
    const colReason = rawHeaders.findIndex(h => h.includes('reason'));
    
    if (colPen === -1) {
      return createJsonResponse({ status: 'error', message: 'PEN column not found' });
    }
    
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      let p = values[i][colPen];
      if (typeof p === 'number') p = p.toLocaleString('fullwide', { useGrouping: false });
      if (String(p).trim() === penToUpdate) {
        rowIndex = i + 1; // 1-based index in Google Sheets
        break;
      }
    }
    
    if (rowIndex === -1) {
      return createJsonResponse({ status: 'error', message: 'Student PEN not found in sheet' });
    }
    
    // Update cells if provided
    if (postData.isAadhaarVerified && colVer !== -1) {
      sheet.getRange(rowIndex, colVer + 1).setValue(postData.isAadhaarVerified);
    }
    if (postData.isAadhaarProvided && colProv !== -1) {
      sheet.getRange(rowIndex, colProv + 1).setValue(postData.isAadhaarProvided);
    }
    if (postData.pendingReason && colReason !== -1) {
      sheet.getRange(rowIndex, colReason + 1).setValue(postData.pendingReason);
    }
    
    return createJsonResponse({
      status: 'success',
      message: 'Student record updated in Google Sheet',
      studentPen: penToUpdate
    });
    
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

// Helper for CORS and JSON response
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
