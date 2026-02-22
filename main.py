"""
Fake News Detector API – analyze articles and get credibility + summary.
"""

import re
from typing import Optional

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from analyzer import analyze

app = FastAPI(
    title="Fake News Detector for Students",
    description="Analyze articles, assess credibility, and get trustworthy summaries.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (frontend) after we have the static folder
STATIC_DIR = __file__.replace("main.py", "static")


class AnalyzeRequest(BaseModel):
    text: Optional[str] = None
    url: Optional[str] = None


class AnalyzeResponse(BaseModel):
    is_reliable: Optional[bool]
    confidence: float
    label: str
    summary: str
    explanation: str


def _fetch_text_from_url(url: str, max_chars: int = 15000) -> str:
    """Fetch URL and extract main text (simple approach)."""
    try:
        resp = requests.get(url, timeout=10, headers={"User-Agent": "FakeNewsDetector/1.0"})
        resp.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Cannot fetch URL: {e}")

    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in ("script", "style", "nav", "footer", "header"):
            for el in soup.find_all(tag):
                el.decompose()
        body = soup.find("article") or soup.find("main") or soup.find("body") or soup
        text = body.get_text(separator=" ", strip=True) if body else ""
        text = re.sub(r"\s+", " ", text)
        return text[:max_chars] if text else ""
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not extract text from page: {e}")


@app.get("/")
def serve_frontend():
    """Serve the main frontend page."""
    index_path = f"{STATIC_DIR}/index.html"
    return FileResponse(index_path)


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_article(body: AnalyzeRequest):
    """Analyze article from raw text or URL."""
    text = (body.text or "").strip()
    url = (body.url or "").strip()
    if url and not text:
        text = _fetch_text_from_url(url)
        if not text:
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from this URL. The page may need JavaScript or be behind a paywall. Try copying the article text and pasting it above instead.",
            )
    if not text:
        raise HTTPException(status_code=400, detail="Provide either 'text' or 'url'.")
    return analyze(text)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "fake-news-detector"}


def _mount_static():
    import os
    if os.path.isdir(STATIC_DIR):
        app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


_mount_static()
