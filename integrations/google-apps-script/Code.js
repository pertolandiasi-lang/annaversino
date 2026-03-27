const CONFIG = {
  spreadsheetId: "",
  leadsSheetName: "Leads",
  dashboardSheetName: "Dashboard",
  notificationEmail: "",
  sendNotificationEmails: true,
  allowedTopics: [
    "How you met your Vulva",
    "Mirror, mirror - Oh Vulvina",
    "VulvaTalks",
    "Workbook",
    "Products",
    "Collaboration",
    "Other"
  ]
};

const LEADS_HEADERS = [
  "Submitted At",
  "First Name",
  "Last Name",
  "Email",
  "Topic",
  "Message",
  "Page URL",
  "Source"
];

function doGet() {
  try {
    const spreadsheet = getSpreadsheet_();
    return jsonResponse_({
      ok: true,
      service: "Vulvaverse contact intake",
      spreadsheetId: spreadsheet.getId(),
      leadsSheet: CONFIG.leadsSheetName,
      dashboardSheet: CONFIG.dashboardSheetName
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: error.message
    });
  }
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const lead = validateLeadPayload_(payload);

    if (lead.website) {
      return jsonResponse_({
        ok: true,
        ignored: true
      });
    }

    const spreadsheet = getSpreadsheet_();
    const leadsSheet = ensureLeadsSheet_(spreadsheet);
    appendLeadRow_(leadsSheet, lead);
    sendLeadNotification_(lead);

    return jsonResponse_({
      ok: true,
      message: "Lead saved."
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: error.message
    });
  }
}

function setupContactWorkbook() {
  const spreadsheet = getSpreadsheet_();
  const leadsSheet = ensureLeadsSheet_(spreadsheet);
  const dashboardSheet = ensureDashboardSheet_(spreadsheet);

  formatLeadsSheet_(leadsSheet);
  buildDashboard_(dashboardSheet);
  SpreadsheetApp.flush();

  return spreadsheet.getUrl();
}

function refreshContactDashboard() {
  const spreadsheet = getSpreadsheet_();
  const dashboardSheet = ensureDashboardSheet_(spreadsheet);
  buildDashboard_(dashboardSheet);
  SpreadsheetApp.flush();

  return "Dashboard refreshed.";
}

function sendTestNotification() {
  const notificationRecipient = getNotificationRecipient_();

  if (!notificationRecipient) {
    throw new Error("Add CONFIG.notificationEmail or use an account with an email address.");
  }

  MailApp.sendEmail(
    notificationRecipient,
    "Vulvaverse contact form test",
    "This is a test notification from your Vulvaverse contact form Apps Script."
  );

  return "Test email sent to " + notificationRecipient;
}

function getSpreadsheet_() {
  if (CONFIG.spreadsheetId && CONFIG.spreadsheetId.trim()) {
    return SpreadsheetApp.openById(CONFIG.spreadsheetId.trim());
  }

  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (activeSpreadsheet) {
    return activeSpreadsheet;
  }

  throw new Error(
    "Add CONFIG.spreadsheetId or bind this Apps Script project to the target Google Sheet."
  );
}

function ensureLeadsSheet_(spreadsheet) {
  const sheet =
    spreadsheet.getSheetByName(CONFIG.leadsSheetName) ||
    spreadsheet.insertSheet(CONFIG.leadsSheetName);

  formatLeadsSheet_(sheet);
  return sheet;
}

function ensureDashboardSheet_(spreadsheet) {
  return (
    spreadsheet.getSheetByName(CONFIG.dashboardSheetName) ||
    spreadsheet.insertSheet(CONFIG.dashboardSheetName)
  );
}

function formatLeadsSheet_(sheet) {
  const dataRowCount = Math.max(sheet.getMaxRows() - 1, 1);

  sheet.clearConditionalFormatRules();
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, LEADS_HEADERS.length).setValues([LEADS_HEADERS]);
  sheet.getRange("A:A").setNumberFormat("yyyy-mm-dd hh:mm");
  sheet.getRange(1, 1, 1, LEADS_HEADERS.length)
    .setFontWeight("bold")
    .setBackground("#2f255e")
    .setFontColor("#ffffff");
  sheet.autoResizeColumns(1, LEADS_HEADERS.length);
  sheet.setColumnWidth(6, 360);
  sheet.setColumnWidth(7, 280);
  sheet.setColumnWidth(8, 180);
  sheet.getRange("F:F").setWrap(true);

  const topicValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.allowedTopics, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(2, 5, dataRowCount, 1).setDataValidation(topicValidation);

  if (sheet.getFilter()) {
    sheet.getFilter().remove();
  }

  const lastRow = Math.max(sheet.getLastRow(), 2);
  sheet.getRange(1, 1, lastRow, LEADS_HEADERS.length).createFilter();
}

function buildDashboard_(sheet) {
  const dashboardRowCount = Math.max(sheet.getMaxRows(), 200);

  sheet.clear();
  sheet.clearConditionalFormatRules();
  sheet.getCharts().forEach((chart) => sheet.removeChart(chart));
  sheet.setHiddenGridlines(true);
  sheet.setFrozenRows(1);
  sheet.setColumnWidths(1, 2, 170);
  sheet.setColumnWidths(4, 2, 180);
  sheet.setColumnWidths(7, 2, 160);
  sheet.setColumnWidths(10, 8, 150);
  sheet.setColumnWidth(15, 260);

  sheet.getRange("A1").setValue("Vulvaverse Contact Dashboard");
  sheet.getRange("A1")
    .setFontSize(18)
    .setFontWeight("bold")
    .setFontColor("#2f255e");
  sheet.getRange("A2").setValue("Overview");
  sheet.getRange("D2").setValue("Submissions by Topic");
  sheet.getRange("G2").setValue("Submission Trend");
  sheet.getRange("J2").setValue("Recent Leads");
  sheet.getRange("A2:J2")
    .setFontWeight("bold")
    .setFontColor("#4b407c");

  sheet.getRange("A3:A5").setValues([
    ["Total submissions"],
    ["Unique email addresses"],
    ["Submissions in last 30 days"]
  ]);
  sheet.getRange("B3").setFormula("=COUNTA(Leads!A2:A)");
  sheet
    .getRange("B4")
    .setFormula('=IFERROR(COUNTA(UNIQUE(FILTER(Leads!D2:D,Leads!D2:D<>""))),0)');
  sheet.getRange("B5").setFormula('=COUNTIFS(Leads!A2:A,">="&TODAY()-30)');
  sheet.getRange("A3:B5")
    .setBackground("#f5efff")
    .setBorder(true, true, true, true, false, false, "#d5c8f4", SpreadsheetApp.BorderStyle.SOLID);

  sheet
    .getRange("D3")
    .setFormula(
      '={"Topic","Submissions";IFERROR(QUERY(Leads!E2:E,"select E, count(E) where E is not null group by E label E \'\', count(E) \'\'",0),{"No data",0})}'
    );
  sheet
    .getRange("G3")
    .setFormula(
      '={"Date","Submissions";IFERROR(QUERY({INT(Leads!A2:A),Leads!A2:A},"select Col1, count(Col2) where Col2 is not null group by Col1 order by Col1 label Col1 \'\', count(Col2) \'\'",0),{"",0})}'
    );
  sheet
    .getRange("J3")
    .setFormula(
      '={"Submitted At","First Name","Last Name","Email","Topic","Message","Page URL","Source";IFERROR(QUERY(Leads!A2:H,"select A,B,C,D,E,F,G,H where A is not null order by A desc limit 10 label A \'\', B \'\', C \'\', D \'\', E \'\', F \'\', G \'\', H \'\'",0),{"","","","","","","",""})}'
    );

  sheet.getRange("G:G").setNumberFormat("yyyy-mm-dd");
  sheet.getRange("J:Q").setWrap(true);
  sheet.getRange(3, 4, dashboardRowCount - 2, 2).setHorizontalAlignment("left");
  sheet.getRange("A3:B5").setHorizontalAlignment("left");

  SpreadsheetApp.flush();

  const topicChart = sheet
    .newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(sheet.getRange("D3:E24"))
    .setPosition(8, 4, 0, 0)
    .setOption("title", "Submissions by Topic")
    .setOption("legend", { position: "none" })
    .setOption("colors", ["#7c62d6"])
    .build();

  const trendChart = sheet
    .newChart()
    .setChartType(Charts.ChartType.LINE)
    .addRange(sheet.getRange("G3:H64"))
    .setPosition(8, 10, 0, 0)
    .setOption("title", "Submission Trend")
    .setOption("legend", { position: "none" })
    .setOption("colors", ["#efb7ca"])
    .build();

  sheet.insertChart(topicChart);
  sheet.insertChart(trendChart);
}

function appendLeadRow_(sheet, lead) {
  sheet.appendRow([
    new Date(),
    lead.first_name,
    lead.last_name,
    lead.email,
    lead.topic,
    lead.message,
    lead.page_url,
    lead.source
  ]);
}

function sendLeadNotification_(lead) {
  if (!CONFIG.sendNotificationEmails) {
    return;
  }

  const notificationRecipient = getNotificationRecipient_();

  if (!notificationRecipient) {
    return;
  }

  const subject = "New Vulvaverse contact form submission";
  const body = [
    "A new contact form submission was received.",
    "",
    "First name: " + lead.first_name,
    "Last name: " + lead.last_name,
    "Email: " + lead.email,
    "Topic: " + lead.topic,
    "Source: " + lead.source,
    "Page URL: " + lead.page_url,
    "",
    "Message:",
    lead.message
  ].join("\n");

  try {
    MailApp.sendEmail(notificationRecipient, subject, body, {
      name: "Vulvaverse Contact Form",
      replyTo: lead.email
    });
  } catch (error) {
    console.error("Lead notification email failed:", error);
  }
}

function getNotificationRecipient_() {
  if (CONFIG.notificationEmail && CONFIG.notificationEmail.trim()) {
    return CONFIG.notificationEmail.trim();
  }

  const effectiveUserEmail = Session.getEffectiveUser().getEmail();
  return cleanString_(effectiveUserEmail);
}

function parsePayload_(e) {
  const rawContents = e && e.postData ? e.postData.contents : "";

  if (rawContents) {
    try {
      return JSON.parse(rawContents);
    } catch (error) {
      // Fallback to parameter parsing below.
    }
  }

  const parameter = (e && e.parameter) || {};
  return {
    first_name: parameter.first_name,
    last_name: parameter.last_name,
    email: parameter.email,
    topic: parameter.topic,
    message: parameter.message,
    page_url: parameter.page_url,
    source: parameter.source,
    website: parameter.website
  };
}

function validateLeadPayload_(payload) {
  const lead = {
    first_name: cleanString_(payload.first_name),
    last_name: cleanString_(payload.last_name),
    email: cleanString_(payload.email).toLowerCase(),
    topic: cleanString_(payload.topic),
    message: cleanString_(payload.message),
    page_url: cleanString_(payload.page_url),
    source: cleanString_(payload.source) || "website-contact-form",
    website: cleanString_(payload.website)
  };

  if (lead.website) {
    return lead;
  }

  const missingFields = [];

  if (!lead.first_name) {
    missingFields.push("first_name");
  }
  if (!lead.last_name) {
    missingFields.push("last_name");
  }
  if (!lead.email) {
    missingFields.push("email");
  }
  if (!lead.topic) {
    missingFields.push("topic");
  }
  if (!lead.message) {
    missingFields.push("message");
  }

  if (missingFields.length > 0) {
    throw new Error("Missing required fields: " + missingFields.join(", "));
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    throw new Error("Please provide a valid email address.");
  }

  if (CONFIG.allowedTopics.indexOf(lead.topic) === -1) {
    throw new Error("Topic must match one of the website contact options.");
  }

  return lead;
}

function cleanString_(value) {
  return String(value || "").trim();
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
