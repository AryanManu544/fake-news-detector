(function () {
  const articleText = document.getElementById("article-text");
  const articleUrl = document.getElementById("article-url");
  const analyzeBtn = document.getElementById("analyze-btn");
  const resultsSection = document.getElementById("results-section");
  const errorSection = document.getElementById("error-section");
  const errorMessage = document.getElementById("error-message");
  const textHint = document.getElementById("text-hint");
  const credibilityRing = document.getElementById("credibility-ring");
  const ringFill = document.getElementById("ring-fill");
  const credibilityIcon = document.getElementById("credibility-icon");
  const credibilityLabel = document.getElementById("credibility-label");
  const credibilityConfidence = document.getElementById("credibility-confidence");
  const resultSummary = document.getElementById("result-summary");
  const resultExplanation = document.getElementById("result-explanation");

  const tabs = document.querySelectorAll(".tab");
  const inputAreaText = document.querySelector(".input-area--text");
  const inputAreaUrl = document.querySelector(".input-area--url");

  const RING_CIRCUMFERENCE = 2 * Math.PI * 36;

  function setMode(mode) {
    const isUrl = mode === "url";
    tabs.forEach(function (t) {
      t.classList.toggle("active", t.dataset.mode === mode);
      t.setAttribute("aria-selected", t.dataset.mode === mode ? "true" : "false");
    });
    inputAreaText.classList.toggle("active", !isUrl);
    inputAreaUrl.classList.toggle("active", isUrl);
    inputAreaText.hidden = isUrl;
    inputAreaUrl.hidden = !isUrl;
    if (!isUrl) articleText.focus();
    else articleUrl.focus();
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      setMode(tab.dataset.mode);
    });
  });

  articleText.addEventListener("input", function () {
    const len = (articleText.value || "").trim().length;
    if (len === 0) textHint.textContent = "";
    else if (len < 100) textHint.textContent = "Add more text for a better analysis (at least a few sentences).";
    else textHint.textContent = len + " characters";
  });

  function showError(msg) {
    errorMessage.textContent = msg;
    errorSection.classList.remove("hidden");
    resultsSection.classList.add("hidden");
  }

  function hideError() {
    errorSection.classList.add("hidden");
  }

  function setRingProgress(percent) {
    if (!ringFill) return;
    var offset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * percent) / 100;
    ringFill.setAttribute("stroke-dasharray", RING_CIRCUMFERENCE);
    ringFill.setAttribute("stroke-dashoffset", Math.max(0, offset));
  }

  function showResults(data) {
    hideError();
    var state = data.label === "real" ? "reliable" : data.label === "fake" ? "fake" : "unknown";
    credibilityRing.setAttribute("data-state", state);

    var labels = { reliable: "Likely reliable", fake: "Likely unreliable", unknown: "Uncertain" };
    credibilityLabel.textContent = labels[state] || "Uncertain";
    var confidencePercent = data.confidence != null ? Math.round(data.confidence * 100) : 0;
    credibilityConfidence.textContent = confidencePercent ? confidencePercent + "% confidence" : "";
    setRingProgress(confidencePercent);

    var icons = { reliable: "✓", fake: "⚠", unknown: "?" };
    credibilityIcon.textContent = icons[state] || "?";

    resultSummary.textContent = data.summary || "No summary available.";
    resultExplanation.textContent = data.explanation || "";

    resultsSection.classList.remove("hidden");
    resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setLoading(loading) {
    analyzeBtn.disabled = loading;
    analyzeBtn.classList.toggle("loading", loading);
  }

  analyzeBtn.addEventListener("click", async function () {
    var isUrl = inputAreaUrl.classList.contains("active");
    var text = (articleText.value || "").trim();
    var url = (articleUrl.value || "").trim();

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
      var body = isUrl ? { url: url, text: null } : { text: text, url: null };
      var res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      var data = await res.json().catch(function () { return {}; });

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
