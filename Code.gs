function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ดึงข้อมูลจากทั้ง 2 Sheet
    const summarySheet = ss.getSheetByName("ชื่อลูกหนี้");
    const dataSheet = ss.getSheetByName("Data1");
    
    if (!summarySheet || !dataSheet) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "ไม่พบชีตชื่อ 'ชื่อลูกหนี้' หรือ 'Data1' กรุณาตรวจสอบชื่อชีตอีกครั้ง" 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 1. ดึงข้อมูลชีต "ชื่อลูกหนี้"
    const summaryValues = summarySheet.getDataRange().getValues();
    
    // 2. ดึงข้อมูลชีต "Data1"
    const dataValues = dataSheet.getDataRange().getValues();
    
    const responseData = {
      status: "success",
      summary: {
        headers: summaryValues.length > 0 ? summaryValues[0] : [],
        data: summaryValues.length > 1 ? summaryValues.slice(1) : []
      },
      details: {
        headers: dataValues.length > 0 ? dataValues[0] : [],
        data: dataValues.length > 1 ? dataValues.slice(1) : []
      }
    };
    
    // ส่งข้อมูลกลับไปเป็น JSON ให้เว็บข้างนอก (index.html) เรียกใช้
    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
