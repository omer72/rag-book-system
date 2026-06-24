import "dotenv/config";

import { uploadAndWait } from "./src/uploader.js";
import { askQuestion, askMultiple } from "./src/query.js";
import { createBookCache, askWithCache } from "./src/cache-manager.js";
import { cleanExpired } from "./src/file-cache.js";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("שגיאה: חסר GEMINI_API_KEY בקובץ .env");
  process.exit(1);
}

// ===== דוגמה 1: שאלה בודדת על ספר =====
async function singleQuestion() {
  const bookPath = process.argv[2] || "book.pdf";
  const question = process.argv[3] || "מהם הנושאים המרכזיים בספר?";

  console.log("=== RAG Book System ===\n");

  // ניקוי קאש ישן
  cleanExpired();

  // העלאה (או שימוש בקאש אם קיים)
  const fileUri = await uploadAndWait(API_KEY, bookPath, "My Book");

  // שאילתה
  const answer = await askQuestion(API_KEY, fileUri, question);

  console.log("\n--- תשובה ---");
  console.log(answer);
}

// ===== דוגמה 2: מספר שאלות על ספר =====
async function multipleQuestions() {
  const bookPath = process.argv[2] || "book.pdf";

  console.log("=== RAG Book System - Multi Query ===\n");

  cleanExpired();
  const fileUri = await uploadAndWait(API_KEY, bookPath, "My Book");

  const questions = [
    "מהם שלושת העקרונות המרכזיים בפרק הראשון?",
    "תן סיכום קצר של הספר ב-5 משפטים.",
    "מהי המסקנה העיקרית של המחבר?",
  ];

  const results = await askMultiple(API_KEY, fileUri, questions);

  console.log("\n--- תשובות ---");
  for (const { question, answer } of results) {
    console.log(`\nשאלה: ${question}`);
    console.log(`תשובה: ${answer}`);
    console.log("-".repeat(50));
  }
}

// ===== דוגמה 3: שימוש ב-Context Cache לספר גדול =====
async function cachedSession() {
  const bookPath = process.argv[2] || "book.pdf";

  console.log("=== RAG Book System - Cached Session ===\n");

  cleanExpired();
  const fileUri = await uploadAndWait(API_KEY, bookPath, "My Book");

  // יצירת cache (משתלם רק ל-32K+ טוקנים)
  const cache = await createBookCache(API_KEY, fileUri);

  const questions = [
    "תן סיכום של הפרק הראשון.",
    "מי הדמויות המרכזיות?",
    "מהי ההמלצה המרכזית של הספר?",
  ];

  for (const q of questions) {
    const answer = await askWithCache(API_KEY, cache, q);
    console.log(`\nשאלה: ${q}`);
    console.log(`תשובה: ${answer}\n`);
  }
}

// הרצה
const mode = process.argv[3] === "--multi" ? "multi"
           : process.argv[3] === "--cached" ? "cached"
           : "single";

(async () => {
  try {
    if (mode === "multi") await multipleQuestions();
    else if (mode === "cached") await cachedSession();
    else await singleQuestion();
  } catch (error) {
    console.error("שגיאה:", error.message);
    process.exit(1);
  }
})();
