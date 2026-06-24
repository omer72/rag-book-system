import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_INSTRUCTION =
  "You are an expert on the content of the attached book. " +
  "LANGUAGE RULE: Detect the language of the user's question and answer ENTIRELY in that same language. " +
  "If the question is in English, answer in English. If in Hebrew, answer in Hebrew. Never mix languages. " +
  "Answer strictly based on the content of the file. " +
  "If the information is not in the book, say so in the user's language. " +
  "Cite relevant page numbers when possible, and follow each page citation with a short verbatim quote (5-15 words) from that page in double quotes. " +
  "Examples: page 12: \"the exact sentence from the book\". עמוד 12: \"המשפט המדויק מהספר\".";

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
