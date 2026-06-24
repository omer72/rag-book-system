# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Requires `GEMINI_API_KEY` in `.env`. No test or lint scripts are configured.

- `npm run dev` — Next.js web UI (chat against the auto-loaded `book.pdf`)
- `npm run build` / `npm run start:next` — production Next.js build
- `npm start` / `npm run query` — CLI single-question mode. Args: `node index.js <pdf-path> "<question>"`
- `npm run multi` — CLI multi-question demo (`node index.js book.pdf --multi`)
- `npm run cached` — CLI demo using Gemini Context Cache (`node index.js book.pdf --cached`)

Mode is picked from `process.argv[3]` (`--multi` / `--cached`), so when invoking the CLI directly always pass the PDF path as the first positional arg even if the mode flag is what you really want.

## Architecture

Two front-ends share the same core: a Node CLI (`index.js`) and a Next.js App Router app (`app/`). Both call into `src/` for upload, query, and caching.

### Core flow (`src/`)

1. `uploader.js` — `uploadAndWait()` uploads a PDF to the Gemini File API and polls `getFile()` every 2s until state leaves `PROCESSING`. Returns a `fileUri`.
2. `query.js` — `askQuestion()` / `askMultiple()` wrap `generateContent` with a Hebrew system instruction that forces grounding ("answer only from the file, say 'not found' otherwise, cite page numbers, reply in the asker's language"). Default model is `gemini-2.5-flash`.
3. `cache-manager.js` — wraps Gemini's server-side **Context Cache** (`createCachedContent` / `getGenerativeModelFromCachedContent`). This is a paid feature that only pays off for 32K+ token files with many questions; not the same thing as the local URI cache below.

### Two independent caches (do not conflate)

- **Local URI cache** (`src/file-cache.js`, persisted to `file-cache.json`): MD5-hashes the PDF on disk and stores `{hash → fileUri, uploadedAt}`. Reused if younger than `MAX_AGE_HOURS = 47` (Google deletes uploaded files after 48h — the 1h margin is deliberate). `cleanExpired()` is called before each upload. Edit this if you change the freshness window or move the cache file.
- **Gemini Context Cache** (`src/cache-manager.js`): server-side, billed, TTL passed via `ttlSeconds`. Only used in `--cached` CLI mode.

### Next.js side (`app/`)

- `app/api/state.js` holds a **module-level singleton** (`state.currentFileUri`, `loading`, `error`, `needsUpload`). On first import it auto-loads `book.pdf` from CWD if present; otherwise it sets `needsUpload=true` and waits for the UI to POST a file. Singleton only works under a single long-lived Node process (`next dev` or a single `next start`); it will not survive serverless multi-instance deploys.
- `app/api/status/route.js` exposes the singleton for the client to poll every 1s.
- `app/api/ask/route.js` calls `askQuestion()` against `state.currentFileUri`.
- `app/api/upload/route.js` accepts a PDF as `multipart/form-data` (`file` field), writes it to `./book.pdf`, and awaits `loadBook()` so the response indicates ready/error in one shot.
- `app/page.js` is a single client component that polls `/api/status`; renders an upload button when `needsUpload`, then chats via `/api/ask`.

### Language note

System prompts, log lines, and code comments are in Hebrew. The grounding instruction tells the model to **reply in the language of the question**, so English questions get English answers despite the Hebrew prompt.
