import fs from "fs";
import { uploadAndWait } from "../../src/uploader.js";
import { cleanExpired } from "../../src/file-cache.js";

export const state = {
  currentFileUri: null,
  currentFileName: null,
  loading: false,
  error: null,
  needsUpload: false,
};

const DEFAULT_BOOK_PATH = "book.pdf";
const DEFAULT_BOOK_NAME = "My Book";

export async function loadBook(filePath, displayName) {
  state.loading = true;
  state.error = null;
  state.needsUpload = false;
  try {
    cleanExpired();
    const uri = await uploadAndWait(
      process.env.GEMINI_API_KEY,
      filePath,
      displayName,
    );
    state.currentFileUri = uri;
    state.currentFileName = displayName;
    console.log(`[Server] ${displayName} ready`);
  } catch (err) {
    state.error = err.message;
    console.error(`[Server] Failed to load ${displayName}:`, err.message);
  } finally {
    state.loading = false;
  }
}

if (!state.currentFileUri && !state.loading) {
  if (fs.existsSync(DEFAULT_BOOK_PATH)) {
    loadBook(DEFAULT_BOOK_PATH, DEFAULT_BOOK_NAME);
  } else {
    state.needsUpload = true;
  }
}
