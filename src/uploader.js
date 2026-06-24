import { GoogleAIFileManager } from "@google/generative-ai/server";
import { getCachedUri, setCachedUri } from "./file-cache.js";

const POLL_INTERVAL_MS = 2000; // בדיקה כל 2 שניות

/**
 * מעלה קובץ PDF ל-Google File API וממתין שיסיים עיבוד
 * אם הקובץ כבר הועלה ועדיין תקף - מחזיר מהקאש
 *
 * @param {string} apiKey - Google API Key
 * @param {string} filePath - נתיב לקובץ PDF
 * @param {string} displayName - שם תצוגה לקובץ
 * @returns {Promise<string>} File URI לשימוש בשאילתות
 */
export async function uploadAndWait(apiKey, filePath, displayName) {
  // בדיקה בקאש קודם
  const cachedUri = getCachedUri(filePath);
  if (cachedUri) return cachedUri;

  const fileManager = new GoogleAIFileManager(apiKey);

  // העלאת הקובץ
  console.log(`[Upload] מעלה: ${displayName}...`);
  const uploadResponse = await fileManager.uploadFile(filePath, {
    mimeType: "application/pdf",
    displayName: displayName,
  });

  const fileName = uploadResponse.file.name;
  console.log(`[Upload] הקובץ הועלה. ממתין לעיבוד: ${fileName}`);

  // Polling - בדיקה כל כמה שניות אם הקובץ מוכן
  let file = await fileManager.getFile(fileName);
  while (file.state === "PROCESSING") {
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    file = await fileManager.getFile(fileName);
  }

  if (file.state === "FAILED") {
    throw new Error(`עיבוד הקובץ נכשל: ${fileName}`);
  }

  console.log("\n[Upload] הקובץ מוכן לשימוש!");

  // שמירה בקאש
  setCachedUri(filePath, file.uri, displayName);

  return file.uri;
}
