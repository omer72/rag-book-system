import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_INSTRUCTION =
  "אתה מומחה לתוכן הספר המצורף. " +
  "ענה אך ורק על בסיס המידע בקובץ. " +
  "אם המידע לא קיים בספר, אמור 'המידע לא נמצא בספר'. " +
  "ציין מספרי עמודים רלוונטיים כשאפשר. " +
  "ענה בשפה שבה נשאלת השאלה.";

/**
 * שואל שאלה על ספר שהועלה
 *
 * @param {string} apiKey - Google API Key
 * @param {string} fileUri - URI של הקובץ (מ-uploadAndWait)
 * @param {string} question - השאלה לשאול
 * @param {object} options - אפשרויות נוספות
 * @param {string} options.model - שם המודל (ברירת מחדל: gemini-2.5-flash)
 * @param {string} options.systemInstruction - הוראות מערכת מותאמות
 * @returns {Promise<string>} התשובה מהמודל
 */
export async function askQuestion(apiKey, fileUri, question, options = {}) {
  const {
    model: modelName = "gemini-2.5-flash",
    systemInstruction = SYSTEM_INSTRUCTION,
  } = options;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
  });

  console.log(`[Query] שואל: "${question}" (מודל: ${modelName})`);

  const result = await model.generateContent([
    {
      fileData: {
        mimeType: "application/pdf",
        fileUri: fileUri,
      },
    },
    { text: question },
  ]);

  return result.response.text();
}

/**
 * שואל מספר שאלות ברצף על אותו ספר
 *
 * @param {string} apiKey
 * @param {string} fileUri
 * @param {string[]} questions - מערך שאלות
 * @param {object} options
 * @returns {Promise<Array<{question: string, answer: string}>>}
 */
export async function askMultiple(apiKey, fileUri, questions, options = {}) {
  const results = [];

  for (const question of questions) {
    const answer = await askQuestion(apiKey, fileUri, question, options);
    results.push({ question, answer });
  }

  return results;
}
