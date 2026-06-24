"use client";

import { useState, useRef, useEffect } from "react";
import "./globals.css";

// ponytail: simple regex covering common Hebrew/English page mentions
const PAGE_RE = /(?:page|p\.|עמוד|עמ['׳]|דף)\s*(\d+)/gi;
// Optional quote (in any common quote mark) right after a page mention
const QUOTE_AFTER_RE = /^[\s:,\-–—]*["“״'‘]([^"”״'’\n]{3,200})["”״'’]/;

function renderWithPageLinks(text, onPageClick) {
  const parts = [];
  let last = 0;
  PAGE_RE.lastIndex = 0;
  let m;
  while ((m = PAGE_RE.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const page = parseInt(m[1], 10);
    const afterEnd = m.index + m[0].length;
    const q = text.slice(afterEnd, afterEnd + 300).match(QUOTE_AFTER_RE);
    const quote = q ? q[1] : null;
    parts.push(
      <button
        key={`${m.index}-${page}`}
        className="page-link"
        onClick={() => onPageClick({ page, quote })}
      >
        {m[0]}
      </button>,
    );
    last = afterEnd;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [fileReady, setFileReady] = useState(false);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsUpload, setNeedsUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [asking, setAsking] = useState(false);
  const [pdfTarget, setPdfTarget] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const poll = setInterval(() => {
      fetch("/api/status")
        .then((r) => r.json())
        .then((data) => {
          if (data.ready) {
            setFileReady(true);
            setFileName(data.fileName || "book.pdf");
            setNeedsUpload(false);
            setLoading(false);
            clearInterval(poll);
          } else if (data.needsUpload) {
            setNeedsUpload(true);
            setLoading(false);
          } else if (data.error) {
            setLoading(false);
            setMessages([{ role: "system", text: `Error: ${data.error}` }]);
            clearInterval(poll);
          }
        })
        .catch(() => {});
    }, 1000);

    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setUploadError("Please choose a PDF file.");
      return;
    }

    const wasReady = fileReady;
    setUploadError("");
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (data.ready) {
        setFileReady(true);
        setFileName(data.fileName || file.name);
        setMessages([]);
        setPdfTarget(null);
        setNeedsUpload(false);
        setLoading(false);
      } else {
        const msg = data.error || "Upload failed.";
        setUploadError(msg);
        if (!wasReady) setNeedsUpload(true);
        else setMessages((prev) => [...prev, { role: "system", text: `Replace failed: ${msg}` }]);
      }
    } catch (err) {
      const msg = err.message || "Upload failed.";
      setUploadError(msg);
      if (!wasReady) setNeedsUpload(true);
      else setMessages((prev) => [...prev, { role: "system", text: `Replace failed: ${msg}` }]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || !fileReady || asking) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setAsking(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      if (data.answer) {
        setMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "system", text: `Error: ${data.error}` },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "system", text: "Failed to get answer." },
      ]);
    }

    setAsking(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`workspace${pdfTarget ? " with-pdf" : ""}`}>
      <div className="app">
        <header className="header">
          <h1>RAG Book Chat</h1>
          {fileReady && <span className="file-badge">{fileName}</span>}
          {loading && !needsUpload && (
            <span className="file-badge loading-badge">
              {uploading ? "Uploading..." : "Loading book..."}
            </span>
          )}
          {fileReady && !uploading && (
            <button
              className="btn"
              style={{ marginLeft: "auto", fontSize: 12, padding: "4px 10px" }}
              onClick={() => fileInputRef.current?.click()}
              disabled={asking || uploading}
            >
              Replace
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
        </header>

        <div className="messages">
          {needsUpload && (
            <div className="empty-state">
              <div className="empty-icon">📤</div>
              <p>Upload a PDF book to start chatting.</p>
              <button
                className="btn send-btn"
                style={{ marginTop: 16 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Choose PDF"}
              </button>
              {uploadError && (
                <p style={{ color: "#f87171", marginTop: 12 }}>{uploadError}</p>
              )}
            </div>
          )}
          {!needsUpload && messages.length === 0 && !loading && fileReady && (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <p>Ask me anything about the book!</p>
            </div>
          )}
          {!needsUpload && loading && messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <p>{uploading ? "Uploading and processing..." : "Loading book..."}</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="bubble">
                {msg.role === "ai" && <span className="label">AI</span>}
                {msg.role === "user" && <span className="label">You</span>}
                <p dir="auto">
                  {msg.role === "ai"
                    ? renderWithPageLinks(msg.text, setPdfTarget)
                    : msg.text}
                </p>
              </div>
            </div>
          ))}
          {asking && (
            <div className="message ai">
              <div className="bubble thinking">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <footer className="input-area">
          <div className="chat-row">
            <input
              type="text"
              dir="auto"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                fileReady ? "Ask a question about the book..." : "Waiting for book to load..."
              }
              disabled={!fileReady || asking}
            />
            <button
              className="btn send-btn"
              onClick={handleSend}
              disabled={!fileReady || asking || !input.trim()}
            >
              Send
            </button>
          </div>
        </footer>
      </div>

      {pdfTarget && (
        <aside className="pdf-panel">
          <div className="pdf-header">
            <span>
              📖 Page {pdfTarget.page}
              {pdfTarget.quote && (
                <em className="pdf-quote"> — “{pdfTarget.quote}”</em>
              )}
            </span>
            <button
              className="btn pdf-close"
              onClick={() => setPdfTarget(null)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <iframe
            key={`${pdfTarget.page}-${pdfTarget.quote || ""}`}
            title="Book"
            src={`/api/book#page=${pdfTarget.page}${
              pdfTarget.quote ? `&search=${encodeURIComponent(pdfTarget.quote)}` : ""
            }`}
            className="pdf-iframe"
          />
        </aside>
      )}
    </div>
  );
}
