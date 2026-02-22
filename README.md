# Fake News Detector for Students

An AI-powered tool that analyzes articles, assesses credibility, and provides concise summaries so students can tell reliable information from misinformation.

## Features

- **Paste or URL** – Analyze by pasting article text or entering a URL (we extract the main text).
- **Credibility score** – Classification as likely reliable, unreliable, or uncertain, with a confidence score.
- **Trustworthy summary** – Short, factual summary of the article.
- **Clear guidance** – Plain-language explanation and reminders to cross-check with other sources.

## Quick start

### 1. Create a virtual environment (recommended)

```bash
cd "fake news detector"
python3 -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

**Optional (smaller install, CPU only):**  
If you only need CPU and want a lighter install:

```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

### 3. Run the app

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open **http://localhost:8000** in your browser.

## Usage

1. Choose **Paste article** or **Enter URL**.
2. Paste the article text or type a news article URL.
3. Click **Analyze article**.
4. Read the credibility badge, summary, and explanation.

## Tech stack

- **Backend:** FastAPI
- **ML:** Hugging Face Transformers  
  - [Pulk17/Fake-News-Detection](https://huggingface.co/Pulk17/Fake-News-Detection) (BERT-based) for real/fake classification  
  - [sshleifer/distilbart-cnn-6-6](https://huggingface.co/sshleifer/distilbart-cnn-6-6) for summarization
- **Frontend:** Vanilla HTML, CSS, and JavaScript (no build step)

The first run will download the models (a few hundred MB); later runs use the cache.

## Project structure

```
fake news detector/
├── main.py           # FastAPI app, routes, URL fetching
├── analyzer.py       # Classification + summarization logic
├── requirements.txt
├── README.md
└── static/
    ├── index.html
    ├── styles.css
    └── app.js
```

## For students and educators

- Use this as a **starting point**, not the final word. Always verify important claims with multiple trusted sources and fact-checking sites.
- Good for classroom discussions about media literacy, source reliability, and how AI can help (and its limits).

## License

MIT.
