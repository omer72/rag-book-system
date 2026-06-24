import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * יוצר Context Cache לספר גדול (מעל 32K טוקנים)
 * חוסך כסף וזמן כשיש הרבה שאלות על אותו ספר
 *
 * @param {string} apiKey - Google API Key
 * @param {string} fileUri - URI של הקובץ
 * @param {object} options
 * @param {number} options.ttlSeconds - זמן חיים לקאש בשניות (ברירת מחדל: 3600)
 * @param {string} options.model - שם המודל (ברירת מחדל: gemini-2.5-flash)
 * @returns {Promise<object>} אובייקט הקאש
 */
export async function createBookCache(apiKey, fileUri, options = {}) {
  const {
    ttlSeconds = 3600,
    model = "models/gemini-2.5-flash",
  } = options;

  const fileManager = new GoogleAIFileManager(apiKey);

  console.log(`[Cache] יוצר Context Cache (TTL: ${ttlSeconds}s)...`);

  const cache = await fileManager.createCachedContent({
    model,
    displayName: "book_cache",
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              fileUri: fileUri,
              mimeType: "application/pdf",
            },
          },
        ],
      },
    ],
    ttlSeconds,
  });

  console.log(`[Cache] Context Cache נוצר: ${cache.name}`);
  return cache;
}

/**
 * שואל שאלה באמצעות Context Cache קיים
 *
 * @param {string} apiKey
 * @param {object} cache - אובייקט הקאש מ-createBookCache
 * @param {string} question
 * @returns {Promise<string>}
 */
export async function askWithCache(apiKey, cache, question) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModelFromCachedContent(cache);

  console.log(`[CachedQuery] שואל: "${question}"`);

  const result = await model.generateContent(question);
  return result.response.text();
}
