import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isVercel = !!process.env.VERCEL;

// On Vercel the project root is read-only; only /tmp is writable.
export const BOOK_PATH = isVercel
  ? "/tmp/book.pdf"
  : path.join(process.cwd(), "book.pdf");

export const FILE_CACHE_PATH = isVercel
  ? "/tmp/rag-file-cache.json"
  : path.join(__dirname, "..", "file-cache.json");
