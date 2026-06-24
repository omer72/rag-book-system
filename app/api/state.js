import { uploadAndWait } from "../../src/uploader.js";
import { cleanExpired } from "../../src/file-cache.js";

export const state = {
  currentFileUri: null,
  currentFileName: null,
  loading: false,
  error: null,
};

// Auto-load book.pdf on first import
const BOOK_PATH = "book.pdf";
const BOOK_NAME = "My Book";

if (!state.currentFileUri && !state.loading) {
  state.loading = true;
  cleanExpired();
  uploadAndWait(process.env.GEMINI_API_KEY, BOOK_PATH, BOOK_NAME)
    .then((uri) => {
      state.currentFileUri = uri;
      state.currentFileName = BOOK_NAME;
      state.loading = false;
      console.log("[Server] book.pdf ready");
    })
    .catch((err) => {
      state.error = err.message;
      state.loading = false;
      console.error("[Server] Failed to load book.pdf:", err.message);
    });
}
