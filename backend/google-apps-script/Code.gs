const SHARED_SECRET = "REPLACE_WITH_A_LONG_RANDOM_SECRET";

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (!SHARED_SECRET || SHARED_SECRET === "REPLACE_WITH_A_LONG_RANDOM_SECRET" || body.secret !== SHARED_SECRET) {
      return json({ success: false, message: "Unauthorized" });
    }
    const to = String(body.to || "").trim();
    const subject = String(body.subject || "CoverBridge verification");
    const html = String(body.html || "");
    if (!to || !html) return json({ success: false, message: "Missing recipient or email content" });
    GmailApp.sendEmail(to, subject, "Your email client does not support HTML.", {
      htmlBody: html,
      name: "CoverBridge"
    });
    return json({ success: true });
  } catch (err) {
    return json({ success: false, message: String(err && err.message || err) });
  }
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
