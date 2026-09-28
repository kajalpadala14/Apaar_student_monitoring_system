/**
 * ==============================================================================
 * DANTEWADA APAAR PENDING SURVEY PORTAL - GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * ==============================================================================
 * 
 * यह स्क्रिप्ट आपके Google Sheet को एक शक्तिशाली API और बैकएंड में बदल देती है।
 * इसके माध्यम से वेब पोर्टल सीधे आपकी Google Sheet से रियल-टाइम डेटा पढ़ेगा (GET)
 * और सर्वे का डेटा (Aadhaar Provided, Verified, Reason) सीधे शीट में सेव करेगा (POST)।
 *
 * COLUMNS MATCHED (चित्र के अनुसार):
 * A: Block Name
 * B: School Name
 * C: UDISE Code
 * D: CLUSTER NAME
 * E: School Management
 * F: School Category
 * G: Class
 * H: Section
 * I: Student PEN
 * J: Student Name
 * K: Is AADHAAR Provided
 * L: Is AADHAAR Verified
 * M: Reason For Not Generated Apaar Id
 * ==============================================================================
 */

// शीट का नाम (यदि आपकी शीट का नाम अलग है तो यहाँ बदलें, जैसे "Sheet1" या "Students")
var SHEET_NAME = "Sheet1";

/**
 * Google Sheets मेन्यू में 'APAAR Survey' ऑप्शन जोड़ना
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("📋 APAAR Survey Portal")
    .addItem("📊 सर्वे स्थिति देखें (Check Survey Stats)", "showSurveyStats")
    .addItem("⚙️ हेडर की जांच करें (Verify Column Headers)", "verifyHeaders")
    .addToUi();
}

/**
 * GET Request Handler - वेब पोर्टल को सभी छात्रों का डेटा JSON में भेजता है
 */
function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params.action || "getStudents";

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = SHEET_NAME ? (ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0]) : ss.getSheets()[0];

    // अगर केवल आँकड़े (Stats) चाहिए
    if (action === "stats") {
      return sendJsonResponse(getStats(sheet));
    }

    // सभी छात्रों की सूची प्राप्त करें
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return sendJsonResponse({ success: true, count: 0, students: [] });
    }

    var headers = data[0].map(function(h) { return String(h).trim(); });
    
    // कॉलम इंडेक्स का पता लगाना
    var colMap = getColumnMapping(headers);

    var students = [];
    var filterBlock = params.block ? String(params.block).trim().toUpperCase() : null;
    var filterCluster = params.cluster ? String(params.cluster).trim().toUpperCase() : null;
    var filterUdise = params.udise ? String(params.udise).trim() : null;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var pen = String(row[colMap.studentPen] || "").trim();
      
      // खाली लाइन छोड़ें
      if (!pen && !row[colMap.studentName]) continue;

      var block = String(row[colMap.blockName] || "").trim();
      var cluster = String(row[colMap.clusterName] || "").trim();
      var udise = String(row[colMap.udiseCode] || "").trim();

      // फ़िल्टर लागू करें
      if (filterUdise && udise !== filterUdise) continue;
      if (filterBlock && block.toUpperCase() !== filterBlock) continue;
      if (filterCluster && cluster.toUpperCase() !== filterCluster) continue;

      var isAadhaarProvided = String(row[colMap.isAadhaarProvided] || "").trim();
      var isAadhaarVerified = String(row[colMap.isAadhaarVerified] || "").trim();
      var reason = String(row[colMap.reason] || "").trim();

      var isCompleted = Boolean(isAadhaarProvided || isAadhaarVerified || reason);

      students.push({
        rowIndex: i + 1, // 1-based sheet row
        id: pen || "ROW_" + (i + 1),
        block_name: block,
        school_name: String(row[colMap.schoolName] || "").trim(),
        udise_code: String(row[colMap.udiseCode] || "").trim(),
        sankul_name: cluster,
        cluster_name: cluster,
        school_management: String(row[colMap.schoolManagement] || "").trim(),
        school_category: String(row[colMap.schoolCategory] || "").trim(),
        class_name: String(row[colMap.className] || "").trim(),
        section: String(row[colMap.section] || "").trim(),
        student_pen_number: pen,
        pen_number: pen,
        student_name_marksheet: String(row[colMap.studentName] || "").trim(),
        student_name_aadhaar: colMap.studentNameAadhaar !== -1 ? String(row[colMap.studentNameAadhaar] || "").trim() : "",
        name_match_status: colMap.nameMatchStatus !== -1 ? String(row[colMap.nameMatchStatus] || "").trim() : "",
        dob_marksheet: colMap.dobMarksheet !== -1 ? String(row[colMap.dobMarksheet] || "").trim() : "",
        dob_aadhaar: colMap.dobAadhaar !== -1 ? String(row[colMap.dobAadhaar] || "").trim() : "",
        dob_match_status: colMap.dobMatchStatus !== -1 ? String(row[colMap.dobMatchStatus] || "").trim() : "",
        father_name: colMap.fatherName !== -1 ? String(row[colMap.fatherName] || "").trim() : "",
        district_name: colMap.districtName !== -1 ? String(row[colMap.districtName] || "").trim() : "",
        student_district: colMap.districtName !== -1 ? String(row[colMap.districtName] || "").trim() : "",
        documents_available: colMap.documentsAvailable !== -1 ? String(row[colMap.documentsAvailable] || "").trim() : "",
        is_aadhaar_provided: isAadhaarProvided,
        is_aadhaar_verified: isAadhaarVerified,
        apaar_pending_reason: reason,
        survey_status: isCompleted ? "SURVEY COMPLETED" : "PENDING"
      });
    }

    return sendJsonResponse({
      success: true,
      totalRecords: students.length,
      students: students
    });

  } catch (error) {
    return sendJsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * POST Request Handler - वेब पोर्टल से आए सर्वे डेटा को Google Sheet में सेव करता है
 */
function doPost(e) {
  // मल्टी-यूजर लॉकिंग ताकि एक साथ कई लोग सेव करें तो डेटा ओवरराइट न हो
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000); // 15 सेकंड तक लॉक प्रतीक्षा
  } catch (err) {
    return sendJsonResponse({ success: false, error: "सर्वर व्यस्त है, कृपया पुनः प्रयास करें (Lock Timeout)" });
  }

  try {
    var contents = e.postData ? e.postData.contents : "";
    var body = {};
    try {
      body = JSON.parse(contents);
    } catch (parseErr) {
      body = e.parameter || {};
    }

    var action = body.action || "updateSurvey";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = SHEET_NAME ? (ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0]) : ss.getSheets()[0];

    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      lock.releaseLock();
      return sendJsonResponse({ success: false, error: "शीट में कोई डेटा नहीं है।" });
    }

    var headers = data[0].map(function(h) { return String(h).trim(); });
    var colMap = getColumnMapping(headers);

    // यदि बल्क अपडेट (Bulk Updates) है
    if (action === "bulkUpdate" && Array.isArray(body.updates)) {
      var updatedCount = 0;
      var penRowIndexMap = {};
      for (var r = 1; r < data.length; r++) {
        var p = String(data[r][colMap.studentPen] || "").trim();
        if (p) penRowIndexMap[p] = r + 1; // 1-indexed
      }

      body.updates.forEach(function(item) {
        var rowNum = penRowIndexMap[String(item.studentPen).trim()];
        if (rowNum) {
          if (item.isAadhaarProvided !== undefined) sheet.getRange(rowNum, colMap.isAadhaarProvided + 1).setValue(item.isAadhaarProvided);
          if (item.isAadhaarVerified !== undefined) sheet.getRange(rowNum, colMap.isAadhaarVerified + 1).setValue(item.isAadhaarVerified);
          if (item.reason !== undefined) sheet.getRange(rowNum, colMap.reason + 1).setValue(item.reason);
          updatedCount++;
        }
      });

      SpreadsheetApp.flush();
      lock.releaseLock();
      return sendJsonResponse({ success: true, updatedCount: updatedCount, message: updatedCount + " रिकॉर्ड सफलतापूर्वक सहेजे गए।" });
    }

    // एकल छात्र का सर्वे सेव करना (Single Survey Update)
    var studentPen = String(body.studentPen || body.student_pen_number || "").trim();
    var rowIndex = body.rowIndex ? parseInt(body.rowIndex) : null;

    var targetRow = null;

    // 1. PEN नंबर से सर्च करें
    if (studentPen) {
      for (var i = 1; i < data.length; i++) {
        var currentPen = String(data[i][colMap.studentPen] || "").trim();
        if (currentPen === studentPen) {
          targetRow = i + 1;
          break;
        }
      }
    }

    // 2. यदि PEN नहीं मिला लेकिन rowIndex भेजा गया था
    if (!targetRow && rowIndex && rowIndex >= 2 && rowIndex <= data.length) {
      targetRow = rowIndex;
    }

    if (!targetRow) {
      lock.releaseLock();
      return sendJsonResponse({ success: false, error: "छात्र का PEN (" + studentPen + ") शीट में नहीं मिला।" });
    }

    // UDISE सुरक्षा जांच (Security Check: Ensure student belongs to school's UDISE)
    var reqUdise = String(body.udiseCode || body.udise_code || body.udise || "").trim();
    if (reqUdise) {
      var rowUdise = String(data[targetRow - 1][colMap.udiseCode] || "").trim();
      if (rowUdise && rowUdise !== reqUdise) {
        lock.releaseLock();
        return sendJsonResponse({
          success: false,
          error: "सुरक्षा उल्लंघन (Unauthorized): यह छात्र आपके स्कूल (UDISE: " + reqUdise + ") का नहीं है।"
        });
      }
    }

    // कॉलम K, L, M में मान लिखें
    var isProvided = body.isAadhaarProvided !== undefined ? body.isAadhaarProvided : body.is_aadhaar_provided;
    var isVerified = body.isAadhaarVerified !== undefined ? body.isAadhaarVerified : body.is_aadhaar_verified;
    var reasonVal = body.reason !== undefined ? body.reason : body.apaar_pending_reason;

    if (isProvided !== undefined) {
      sheet.getRange(targetRow, colMap.isAadhaarProvided + 1).setValue(isProvided);
    }
    if (isVerified !== undefined) {
      sheet.getRange(targetRow, colMap.isAadhaarVerified + 1).setValue(isVerified);
    }
    if (reasonVal !== undefined) {
      sheet.getRange(targetRow, colMap.reason + 1).setValue(reasonVal);
    }

    // नए सर्वे फ़ील्ड्स (Name, DOB, Father Name, District, Documents Availability)
    var aadhaarName = body.studentNameAadhaar !== undefined ? body.studentNameAadhaar : body.student_name_aadhaar;
    if (aadhaarName !== undefined && colMap.studentNameAadhaar !== -1) {
      sheet.getRange(targetRow, colMap.studentNameAadhaar + 1).setValue(aadhaarName);
    }

    var nameMatch = body.nameMatchStatus !== undefined ? body.nameMatchStatus : body.name_match_status;
    if (nameMatch !== undefined && colMap.nameMatchStatus !== -1) {
      sheet.getRange(targetRow, colMap.nameMatchStatus + 1).setValue(nameMatch);
    }

    var dobM = body.dobMarksheet !== undefined ? body.dobMarksheet : body.dob_marksheet;
    if (dobM !== undefined && colMap.dobMarksheet !== -1) {
      sheet.getRange(targetRow, colMap.dobMarksheet + 1).setValue(dobM);
    }

    var dobA = body.dobAadhaar !== undefined ? body.dobAadhaar : body.dob_aadhaar;
    if (dobA !== undefined && colMap.dobAadhaar !== -1) {
      sheet.getRange(targetRow, colMap.dobAadhaar + 1).setValue(dobA);
    }

    var dobMatch = body.dobMatchStatus !== undefined ? body.dobMatchStatus : body.dob_match_status;
    if (dobMatch !== undefined && colMap.dobMatchStatus !== -1) {
      sheet.getRange(targetRow, colMap.dobMatchStatus + 1).setValue(dobMatch);
    }

    var father = body.fatherName !== undefined ? body.fatherName : body.father_name;
    if (father !== undefined && colMap.fatherName !== -1) {
      sheet.getRange(targetRow, colMap.fatherName + 1).setValue(father);
    }

    var district = body.districtName !== undefined ? body.districtName : (body.student_district || body.district_name);
    if (district !== undefined && colMap.districtName !== -1) {
      sheet.getRange(targetRow, colMap.districtName + 1).setValue(district);
    }

    var docAvail = body.documentsAvailable !== undefined ? body.documentsAvailable : body.documents_available;
    if (docAvail !== undefined && colMap.documentsAvailable !== -1) {
      sheet.getRange(targetRow, colMap.documentsAvailable + 1).setValue(docAvail);
    }

    SpreadsheetApp.flush();
    lock.releaseLock();

    return sendJsonResponse({
      success: true,
      message: "सर्वेक्षण सफलतापूर्वक सहेजा गया! (Saved)",
      studentPen: studentPen,
      rowUpdated: targetRow
    });

  } catch (error) {
    lock.releaseLock();
    return sendJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * कॉलम मैपिंग फ़ंक्शन - हेडर के नाम या क्रम से कॉलम इंडेक्स निर्धारित करता है
 */
function getColumnMapping(headers) {
  // डिफ़ॉल्ट इंडेक्स (0-based) चित्र के अनुसार:
  // A=0, B=1, C=2, D=3, E=4, F=5, G=6, H=7, I=8, J=9, K=10, L=11, M=12
  var map = {
    blockName: 0,
    schoolName: 1,
    udiseCode: 2,
    clusterName: 3,
    schoolManagement: 4,
    schoolCategory: 5,
    className: 6,
    section: 7,
    studentPen: 8,
    studentName: 9,
    isAadhaarProvided: 10,
    isAadhaarVerified: 11,
    reason: 12,
    studentNameAadhaar: -1,
    nameMatchStatus: -1,
    dobMarksheet: -1,
    dobAadhaar: -1,
    dobMatchStatus: -1,
    fatherName: -1,
    districtName: -1,
    documentsAvailable: -1
  };

  // हेडर के नाम से डायनेमिक मैचिंग
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i].toLowerCase().replace(/\s+/g, " ");
    if (h.indexOf("block") !== -1) map.blockName = i;
    else if (h.indexOf("school name") !== -1) map.schoolName = i;
    else if (h.indexOf("udise") !== -1) map.udiseCode = i;
    else if (h.indexOf("cluster") !== -1 || h.indexOf("संकुल") !== -1) map.clusterName = i;
    else if (h.indexOf("management") !== -1) map.schoolManagement = i;
    else if (h.indexOf("category") !== -1) map.schoolCategory = i;
    else if (h === "class" || h.indexOf("कक्षा") !== -1) map.className = i;
    else if (h === "section" || h.indexOf("वर्ग") !== -1) map.section = i;
    else if (h.indexOf("pen") !== -1) map.studentPen = i;
    else if (h.indexOf("name match") !== -1 || h.indexOf("नाम मिलान") !== -1) map.nameMatchStatus = i;
    else if (h.indexOf("aadhaar") !== -1 && (h.indexOf("name") !== -1 || h.indexOf("नाम") !== -1)) map.studentNameAadhaar = i;
    else if (h.indexOf("student name") !== -1 || h.indexOf("विद्यार्थी") !== -1) map.studentName = i;
    else if (h.indexOf("dob match") !== -1 || h.indexOf("जन्मतिथि मिलान") !== -1) map.dobMatchStatus = i;
    else if ((h.indexOf("dob") !== -1 || h.indexOf("जन्म") !== -1) && h.indexOf("aadhaar") !== -1) map.dobAadhaar = i;
    else if ((h.indexOf("dob") !== -1 || h.indexOf("जन्म") !== -1) && h.indexOf("marksheet") !== -1) map.dobMarksheet = i;
    else if (h.indexOf("father") !== -1 || h.indexOf("पिता") !== -1) map.fatherName = i;
    else if (h.indexOf("district") !== -1 || h.indexOf("जिला") !== -1) map.districtName = i;
    else if (h.indexOf("document") !== -1 || h.indexOf("दस्तावेज") !== -1 || h.indexOf("दस्तावेज़") !== -1) map.documentsAvailable = i;
    else if (h.indexOf("provided") !== -1) map.isAadhaarProvided = i;
    else if (h.indexOf("verified") !== -1) map.isAadhaarVerified = i;
    else if (h.indexOf("reason") !== -1 || h.indexOf("कारण") !== -1) map.reason = i;
  }

  return map;
}

/**
 * सर्वे स्टैट्स सारांश
 */
function getStats(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { total: 0, completed: 0, pending: 0 };

  var headers = data[0].map(function(h) { return String(h).trim(); });
  var colMap = getColumnMapping(headers);

  var total = 0;
  var completed = 0;

  for (var i = 1; i < data.length; i++) {
    var pen = data[i][colMap.studentPen];
    if (!pen && !data[i][colMap.studentName]) continue;
    total++;

    var isProvided = String(data[i][colMap.isAadhaarProvided] || "").trim();
    var isVerified = String(data[i][colMap.isAadhaarVerified] || "").trim();
    var reason = String(data[i][colMap.reason] || "").trim();

    if (isProvided || isVerified || reason) {
      completed++;
    }
  }

  return {
    totalStudents: total,
    surveyCompleted: completed,
    surveyPending: total - completed,
    completionPercentage: total > 0 ? ((completed / total) * 100).toFixed(1) + "%" : "0%"
  };
}

/**
 * Google Sheets UI में स्थिति दिखाने का फ़ंक्शन
 */
function showSurveyStats() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SHEET_NAME ? (ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0]) : ss.getSheets()[0];
  var stats = getStats(sheet);

  var ui = SpreadsheetApp.getUi();
  ui.alert(
    "📊 Dantewada APAAR Survey Status",
    "कुल छात्र (Total Students): " + stats.totalStudents + "\n" +
    "सर्वे पूर्ण (Completed): " + stats.surveyCompleted + "\n" +
    "सर्वे लंबित (Pending): " + stats.surveyPending + "\n" +
    "प्रगति (Completion %): " + stats.completionPercentage,
    ui.ButtonSet.OK
  );
}

/**
 * हेडर वेरीफाई करने का फ़ंक्शन
 */
function verifyHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SHEET_NAME ? (ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0]) : ss.getSheets()[0];
  var headers = sheet.getRange(1, 1, 1, 13).getValues()[0];
  var colMap = getColumnMapping(headers);

  var ui = SpreadsheetApp.getUi();
  ui.alert(
    "✅ Column Mapping Verification",
    "A: Block -> " + headers[colMap.blockName] + "\n" +
    "B: School -> " + headers[colMap.schoolName] + "\n" +
    "C: UDISE -> " + headers[colMap.udiseCode] + "\n" +
    "D: Cluster -> " + headers[colMap.clusterName] + "\n" +
    "I: Student PEN -> " + headers[colMap.studentPen] + "\n" +
    "J: Student Name -> " + headers[colMap.studentName] + "\n" +
    "K: Aadhaar Provided -> " + headers[colMap.isAadhaarProvided] + "\n" +
    "L: Aadhaar Verified -> " + headers[colMap.isAadhaarVerified] + "\n" +
    "M: Reason -> " + headers[colMap.reason],
    ui.ButtonSet.OK
  );
}

/**
 * JSON Response Helper with CORS
 */
function sendJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * टेस्ट फ़ंक्शन - रन करके देखें कि डेटा सही आ रहा है या नहीं
 */
function testFetchData() {
  var result = doGet();
  Logger.log(result.getContent());
}
