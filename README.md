# rag-book-system

RAG (Retrieval-Augmented Generation) over PDF books using the Gemini API. Ships with both a CLI and a Next.js chat UI.

## Setup

```bash
npm install
echo "GEMINI_API_KEY=your_key_here" > .env
```

Place the PDF you want to query at `./book.pdf` (the web UI loads this path by default).

## Web UI

```bash
npm run dev
```

Open http://localhost:3000. The server auto-uploads `book.pdf` on first request, then you can chat against it.

## CLI

```bash
# Single question
node index.js book.pdf "What are the main themes?"

# Several preset questions (demo)
npm run multi

# Use Gemini Context Cache (worthwhile for 32K+ token PDFs with many questions)
npm run cached
```

## How it works

- Uploads the PDF to the Gemini File API, polls until ready, and stores the resulting URI locally in `file-cache.json` (MD5-keyed, valid 47 hours — Google deletes uploaded files after 48h).
- Subsequent runs reuse the cached URI instead of re-uploading.
- The model is instructed to answer only from the file, cite page numbers when possible, and reply in the language of the question.

## Structure

- `src/uploader.js` — upload + poll
- `src/query.js` — single and batched question helpers
- `src/cache-manager.js` — Gemini server-side Context Cache (paid, optional)
- `src/file-cache.js` — local URI cache keyed by file hash
- `index.js` — CLI entry point
- `app/` — Next.js App Router UI and API routes

## Requirements

- Node.js (ESM)
- A Gemini API key
- `book.pdf` in the project root (for the web UI default)
