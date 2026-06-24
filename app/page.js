"use client";

import { useState, useRef, useEffect } from "react";
import "./globals.css";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [fileReady, setFileReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const poll = setInterval(() => {
      fetch("/api/status")
        .then((r) => r.json())
        .then((data) => {
          if (data.ready) {
            setFileReady(true);
            setLoading(false);
            clearInterval(poll);
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
    <div className="app">
      <header className="header">
        <h1>RAG Book Chat</h1>
        {fileReady && <span className="file-badge">book.pdf</span>}
        {loading && <span className="file-badge loading-badge">Loading book...</span>}
      </header>

      <div className="messages">
        {messages.length === 0 && !loading && fileReady && (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <p>Ask me anything about the book!</p>
          </div>
        )}
        {loading && messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Loading book.pdf...</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="bubble">
              {msg.role === "ai" && <span className="label">AI</span>}
              {msg.role === "user" && <span className="label">You</span>}
              <p>{msg.text}</p>
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
  );
}
