(function () {
  const articleText = document.getElementById("article-text");
  const articleUrl = document.getElementById("article-url");
  const analyzeBtn = document.getElementById("analyze-btn");
  const resultsSection = document.getElementById("results-section");
  const errorSection = document.getElementById("error-section");
  const errorMessage = document.getElementById("error-message");
  const credibilityBadge = document.getElementById("credibility-badge");
  const badgeLabel = credibilityBadge.querySelector(".badge-label");
  const badgeConfidence = credibilityBadge.querySelector(".badge-confidence");
  const badgeIcon = credibilityBadge.querySelector(".badge-icon");
  const resultSummary = document.getElementById("result-summary");
  const resultExplanation = document.getElementById("result-explanation");

  const tabs = document.querySelectorAll(".tab");
  const inputAreaText = document.querySelector(".input-area--text");
  const inputAreaUrl = document.querySelector(".input-area--url");

  function setMode(mode) {
    const isUrl = mode === "url";
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
    tabs.forEach((t) => t.setAttribute("aria-selected", t.dataset.mode === mode ? "true" : "false"));
    inputAreaText.classList.toggle("active", !isUrl);
    inputAreaUrl.classList.toggle("active", isUrl);
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
  });

  function showError(msg) {
    errorMessage.textContent = msg;
    errorSection.classList.remove("hidden");
    resultsSection.classList.add("hidden");
  }

  function hideError() {
    errorSection.classList.add("hidden");
  }

  function showResults(data) {
    hideError();
    const state = data.label === "real" ? "reliable" : data.label === "fake" ? "fake" : "unknown";
    credibilityBadge.setAttribute("data-state", state);

    const labels = { reliable: "Likely reliable", fake: "Likely unreliable", unknown: "Uncertain" };
    badgeLabel.textContent = labels[state] || "Uncertain";
    badgeConfidence.textContent = data.confidence != null ? `(${Math.round(data.confidence * 100)}%)` : "";
    badgeIcon.textContent = state === "reliable" ? "✓" : state === "fake" ? "⚠" : "?";

    resultSummary.textContent = data.summary || "No summary available.";
    resultExplanation.textContent = data.explanation || "";

    resultsSection.classList.remove("hidden");
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setLoading(loading) {
    analyzeBtn.disabled = loading;
    analyzeBtn.classList.toggle("loading", loading);
  }

  analyzeBtn.addEventListener("click", async () => {
    const isUrl = inputAreaUrl.classList.contains("active");
    const text = (articleText.value || "").trim();
    const url = (articleUrl.value || "").trim();

    if (isUrl && !url) {
      showError("Please enter a valid URL.");
      return;
    }
    if (!isUrl && !text) {
      showError("Please paste some article text.");
      return;
    }

    hideError();
    setLoading(true);

    try {
      const body = isUrl
        ? { url: url, text: null }
        : { text: text, url: null };
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(data.detail || res.statusText || "Analysis failed.");
        return;
      }

      showResults(data);
    } catch (err) {
      showError(err.message || "Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  });
})();
