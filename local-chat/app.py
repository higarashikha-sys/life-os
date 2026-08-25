from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "local_chat.db"
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
DEFAULT_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3:8b")

app = FastAPI(title="Local Chat")


def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    return con


class ChatRequest(BaseModel):
    message: str
    model: str | None = None
    system: str | None = None


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return (BASE_DIR / "index.html").read_text(encoding="utf-8")


@app.get("/api/history")
def history() -> list[dict[str, Any]]:
    with db() as con:
        rows = con.execute(
            "SELECT id, role, content, created_at FROM messages ORDER BY id"
        ).fetchall()
    return [dict(r) for r in rows]


@app.delete("/api/history")
def clear_history() -> dict[str, bool]:
    with db() as con:
        con.execute("DELETE FROM messages")
    return {"ok": True}


@app.get("/api/models")
async def models() -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(f"{OLLAMA_URL}/api/tags")
            r.raise_for_status()
            return r.json()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Ollama unavailable: {exc}")


@app.post("/api/chat")
async def chat(req: ChatRequest) -> dict[str, str]:
    text = req.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="message is empty")

    with db() as con:
        con.execute("INSERT INTO messages(role, content) VALUES (?, ?)", ("user", text))
        rows = con.execute(
            "SELECT role, content FROM messages ORDER BY id DESC LIMIT 30"
        ).fetchall()

    messages = [dict(r) for r in reversed(rows)]
    if req.system:
        messages.insert(0, {"role": "system", "content": req.system})

    payload = {
        "model": req.model or DEFAULT_MODEL,
        "messages": messages,
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=300) as client:
            r = await client.post(f"{OLLAMA_URL}/api/chat", json=payload)
            r.raise_for_status()
            data = r.json()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Local model call failed: {exc}")

    answer = data.get("message", {}).get("content", "").strip()
    if not answer:
        raise HTTPException(status_code=502, detail="Local model returned no text")

    with db() as con:
        con.execute("INSERT INTO messages(role, content) VALUES (?, ?)", ("assistant", answer))

    return {"answer": answer, "model": payload["model"]}


@app.get("/api/export")
def export_history() -> dict[str, Any]:
    with db() as con:
        rows = con.execute(
            "SELECT id, role, content, created_at FROM messages ORDER BY id"
        ).fetchall()
    return {"messages": [dict(r) for r in rows]}
