import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = path.join(__dirname, "..", "file-cache.json");
const MAX_AGE_HOURS = 47; // מרווח ביטחון - גוגל מוחקת אחרי 48 שעות

/**
 * טוען את הקאש מהדיסק
 */
function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

/**
 * שומר את הקאש לדיסק
 */
function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
}

/**
 * מחשב hash MD5 לקובץ - מזהה תוכן זהה גם אם השם שונה
 */
function getFileHash(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(buffer).digest("hex");
}

/**
 * בודק אם קובץ כבר הועלה ועדיין תקף
 * @returns {string|null} URI אם תקף, null אם צריך להעלות מחדש
 */
export function getCachedUri(filePath) {
  const cache = loadCache();
  const hash = getFileHash(filePath);
  const entry = cache[hash];

  if (!entry) return null;

  const ageHours = (Date.now() - entry.uploadedAt) / (1000 * 60 * 60);
  if (ageHours >= MAX_AGE_HOURS) {
    console.log(`[Cache] פג תוקף (${ageHours.toFixed(1)} שעות)`);
    return null;
  }

  console.log(`[Cache] נמצא URI תקף (${ageHours.toFixed(1)} שעות): ${entry.uri}`);
  return entry.uri;
}

/**
 * שומר URI חדש בקאש
 */
export function setCachedUri(filePath, uri, displayName) {
  const cache = loadCache();
  const hash = getFileHash(filePath);

  cache[hash] = {
    uri,
    displayName,
    filePath: path.resolve(filePath),
    uploadedAt: Date.now(),
  };

  saveCache(cache);
  console.log(`[Cache] URI נשמר בהצלחה`);
}

/**
 * מנקה רשומות שפג תוקפן
 */
export function cleanExpired() {
  const cache = loadCache();
  let removed = 0;

  for (const [hash, entry] of Object.entries(cache)) {
    const ageHours = (Date.now() - entry.uploadedAt) / (1000 * 60 * 60);
    if (ageHours >= MAX_AGE_HOURS) {
      delete cache[hash];
      removed++;
    }
  }

  if (removed > 0) {
    saveCache(cache);
    console.log(`[Cache] נוקו ${removed} רשומות שפג תוקפן`);
  }

  return removed;
}
