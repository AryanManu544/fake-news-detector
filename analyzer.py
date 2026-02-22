"""
Fake News Analyzer: credibility classification and summarization.
Uses Hugging Face transformers for detection and summarization.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Lazy-loaded pipelines (heavy imports)
_classifier = None
_summarizer = None

# Max lengths for model input
CLASSIFIER_MAX_LENGTH = 512
SUMMARY_MAX_LENGTH = 150
SUMMARY_MIN_LENGTH = 30


def _get_classifier():
    global _classifier
    if _classifier is None:
        try:
            from transformers import pipeline
            _classifier = pipeline(
                "text-classification",
                model="Pulk17/Fake-News-Detection",
                truncation=True,
                max_length=CLASSIFIER_MAX_LENGTH,
            )
        except Exception as e:
            logger.warning("Fake news model failed to load: %s. Using fallback.", e)
            _classifier = "fallback"
    return _classifier


def _get_summarizer():
    global _summarizer
    if _summarizer is None:
        try:
            from transformers import pipeline
            _summarizer = pipeline(
                "summarization",
                model="sshleifer/distilbart-cnn-6-6",
                truncation=True,
            )
        except Exception as e:
            logger.warning("Summarizer failed to load: %s", e)
            _summarizer = None
    return _summarizer


def _truncate_for_classifier(text: str) -> str:
    """Truncate text to roughly fit classifier max length (by chars)."""
    if len(text) <= CLASSIFIER_MAX_LENGTH * 4:  # rough char estimate
        return text
    return text[: CLASSIFIER_MAX_LENGTH * 4].rsplit(" ", 1)[0] + "…"


def _summarize_with_model(text: str) -> Optional[str]:
    summarizer = _get_summarizer()
    if summarizer is None:
        return None
    try:
        if len(text.split()) < 50:
            return text.strip()
        out = summarizer(
            text,
            max_length=SUMMARY_MAX_LENGTH,
            min_length=SUMMARY_MIN_LENGTH,
            do_sample=False,
        )
        if out and isinstance(out, list) and len(out) > 0:
            return (out[0].get("summary_text") or "").strip()
    except Exception as e:
        logger.warning("Summarization error: %s", e)
    return None


def _summarize_fallback(text: str) -> str:
    """Simple extractive fallback: first few sentences."""
    sentences = text.replace("..", ".").split(".")
    sentences = [s.strip() for s in sentences if s.strip()]
    if not sentences:
        return text[:300] + ("…" if len(text) > 300 else "")
    total = 0
    result = []
    for s in sentences:
        if total + len(s) > 400:
            break
        result.append(s)
        total += len(s)
    return ". ".join(result) + ("." if result else "")


def analyze(text: str) -> dict:
    """
    Analyze article text: classify real/fake and produce a short summary.
    Returns dict with: is_reliable, confidence, label, summary, explanation.
    """
    text = (text or "").strip()
    if not text:
        return {
            "is_reliable": None,
            "confidence": 0.0,
            "label": "unknown",
            "summary": "",
            "explanation": "No text provided.",
        }

    # Classify
    classifier = _get_classifier()
    label = "unknown"
    confidence = 0.0

    if classifier == "fallback":
        # Heuristic fallback: very short or all-caps might be suspicious
        words = text.split()
        caps_ratio = sum(1 for w in words if w.isupper() and len(w) > 1) / max(len(words), 1)
        if len(words) < 20 or caps_ratio > 0.3:
            label = "fake"
            confidence = 0.6
        else:
            label = "real"
            confidence = 0.65
    else:
        try:
            truncated = _truncate_for_classifier(text)
            result = classifier(truncated)
            if result and isinstance(result, list):
                r = result[0]
                raw_label = (r.get("label") or "").lower()
                score = float(r.get("score", 0))
                # Normalize label: model may use "real"/"fake" or "LABEL_0"/"LABEL_1"
                if "fake" in raw_label or raw_label == "label_1":
                    label = "fake"
                    confidence = score
                else:
                    label = "real"
                    confidence = score
        except Exception as e:
            logger.warning("Classification error: %s", e)

    is_reliable = label == "real" if label != "unknown" else None
    summary = _summarize_with_model(text) or _summarize_fallback(text)

    if label == "real":
        explanation = (
            "This article was classified as likely reliable. "
            "Always cross-check important claims with other trusted sources."
        )
    elif label == "fake":
        explanation = (
            "This article was classified as likely unreliable or misleading. "
            "Verify facts elsewhere and be cautious before sharing."
        )
    else:
        explanation = (
            "We couldn't confidently assess this text. "
            "Consider checking multiple sources and fact-checking sites."
        )

    return {
        "is_reliable": is_reliable,
        "confidence": round(confidence, 2),
        "label": label,
        "summary": summary,
        "explanation": explanation,
    }
