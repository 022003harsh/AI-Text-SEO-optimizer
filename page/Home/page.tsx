"use client";

import { useState } from "react";

export default function HomePage() {
  // States to store user input, rendered HTML, keywords, etc.
  const [text, setText] = useState("");
  const [renderedText, setRenderedText] = useState("");
  const [keywordData, setKeywordData] = useState<any[]>([]);
  const [modifiedText, setModifiedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [replacedKeywords, setReplacedKeywords] = useState<Set<string>>(new Set());

  // Generates HTML with interactive hoverable suggestions
  const renderInteractiveText = (text: string, keywords: any[]) => {
    if (!keywords.length) return `<p>${text}</p>`;

    // Sort keywords to prevent overlap; longest ones later
    const sorted = [...keywords].sort((a, b) => {
      if (a.start === b.start) return b.end - a.end;
      return a.start - b.start;
    });

    let result = "";
    let cursor = 0;
    let lastEnd = -1;

    for (let i = 0; i < sorted.length; i++) {
      const kw = sorted[i];

      // Skip overlapping keywords
      if (kw.start < lastEnd) continue;

      // Append plain text before keyword
      if (kw.start > cursor) {
        result += text.slice(cursor, kw.start);
      }

      // Build suggestion list UI
      const suggestions = kw.suggestions
        .map(
          (s: any) =>
            `<span class="cursor-pointer text-base px-4 py-2 hover:bg-indigo-700 hover:text-white transition-all border-b border-zinc-700 block whitespace-nowrap" data-replace="${kw.text}" data-new="${s.text}">${s.text}</span>`
        )
        .join("");

      // Wrap keyword with suggestion popup
      result += `
        <span class="relative inline-block align-baseline group font-semibold text-cyan-400 cursor-pointer hover:text-cyan-300 transition whitespace-nowrap mr-2 mb-2">
          <span>${kw.text}</span>
          <div class="absolute hidden group-hover:flex flex-col top-1 left-0 mt-1 bg-zinc-800 text-white border border-cyan-600 rounded-lg shadow-xl z-50 w-max max-w-xs overflow-hidden">
            ${suggestions}
          </div>
        </span>
      `;

      cursor = kw.end;
      lastEnd = kw.end;
    }

    // Append any remaining text after last keyword
    if (cursor < text.length) {
      result += text.slice(cursor);
    }

    return `<div class="leading-relaxed text-white break-words relative z-10 overflow-visible">${result}</div>`;
  };

  // Handles API call and rendering when Analyze is clicked
  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      // Set keyword data and reset states
      setKeywordData(data.keywordData);
      setReplacedKeywords(new Set());
      setModifiedText(text);

      // Render interactive version
      const interactiveHTML = renderInteractiveText(text, data.keywordData);
      setRenderedText(interactiveHTML);
    } finally {
      setLoading(false);
    }
  };

  // Handles click on a suggestion to replace text
  const handleSuggestionClick = (e: any) => {
    const target = e.target;
    if (!target || !target.dataset?.replace) return;

    const oldWord = target.dataset.replace.trim();
    const newWord = target.dataset.new.trim();

    // Skip if already replaced
    if (replacedKeywords.has(oldWord)) return;

    // Replace all occurrences of the word
    const regex = new RegExp(`\\b${oldWord}\\b`, "g");
    const updated = modifiedText.replace(regex, newWord);
    setModifiedText(updated);

    // Track this replacement
    setReplacedKeywords((prev) => new Set(prev).add(oldWord));

    // Re-render updated suggestions
    const updatedHTML = renderInteractiveText(updated, keywordData);
    setRenderedText(updatedHTML);
  };

  return (
    <main
      className="min-h-screen px-4 py-6 sm:px-6 md:px-8 bg-gradient-to-tr from-zinc-900 via-slate-900 to-black text-white font-[Inter] tracking-wide"
      onClick={handleSuggestionClick} // Listen globally for suggestion clicks
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-bold text-center bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-transparent bg-clip-text drop-shadow-md">
          AI-Powered SEO Text Optimizer
        </h1>

        {/* Input Text Area */}
        <textarea
          className="w-full p-4 bg-zinc-800 text-white border border-zinc-700 rounded-lg text-base sm:text-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none shadow-md"
          rows={8}
          placeholder="Paste your paragraph here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
          className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-500 hover:to-purple-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-xl transition"
        >
          {loading ? "Analyzing..." : "Analyze Text"}
        </button>

        {renderedText && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Interactive Suggestions */}
            <div className="w-full lg:w-1/2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-inner relative overflow-visible">
              <h2 className="text-lg sm:text-xl font-semibold text-cyan-300 mb-4 px-6 pt-6">Interactive Suggestions</h2>
              <div className="text-sm sm:text-base flex flex-wrap gap-2 px-6 pb-6 relative z-10 overflow-visible">
                <div className="relative z-10 overflow-visible" dangerouslySetInnerHTML={{ __html: renderedText }} />
              </div>
              <p className="mt-3 text-sm text-zinc-400 px-6 pb-4">
                *Hover over highlighted words to see smart suggestions.
              </p>
            </div>

            {/* Right: Modified Output */}
            <div className="w-full lg:w-1/2 bg-zinc-800 border border-zinc-700 rounded-xl p-6 shadow-inner relative">
              <h2 className="text-lg sm:text-xl font-semibold text-green-400 mb-3">Updated Output</h2>
              {/* Copy Button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(modifiedText);
                  const button = document.getElementById("copyBtn");
                  if (button) {
                    button.innerText = "Copied!";
                    setTimeout(() => (button.innerText = "Copy"), 1500);
                  }
                }}
                id="copyBtn"
                className="absolute top-4 right-4 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition"
              >
                Copy
              </button>

              {/* Final Text Area */}
              <textarea
                className="w-full p-4 bg-zinc-900 text-white border border-zinc-700 rounded-lg text-sm sm:text-base shadow-md"
                rows={10}
                value={modifiedText}
                readOnly
              />
            </div>
          </div>
        )}

        {/* Table of Extracted Keywords */}
        {keywordData.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-inner mt-8">
            <h2 className="text-lg sm:text-xl font-semibold text-yellow-300 mb-4">🔍 SEO Analyzer</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto">
                <thead className="text-cyan-400 border-b border-cyan-700">
                  <tr>
                    <th className="text-left p-2">Keyword</th>
                    <th className="text-left p-2">Score</th>
                    <th className="text-left p-2">Wiki Link</th>
                    <th className="text-left p-2">Wikidata ID</th>
                  </tr>
                </thead>
                <tbody>
                  {keywordData.map((kw, idx) => (
                    <tr key={idx} className="border-b border-zinc-700 hover:bg-zinc-800 transition">
                      <td className="p-2 break-words">{kw.text}</td>
                      <td className="p-2">{kw.score?.toFixed(4) ?? "-"}</td>
                      <td className="p-2 text-blue-400 break-words">
                        {kw.wikiLink ? (
                          <a href={kw.wikiLink} target="_blank" rel="noopener noreferrer">
                            Link ↗
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2 break-words">{kw.wikidataId ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
