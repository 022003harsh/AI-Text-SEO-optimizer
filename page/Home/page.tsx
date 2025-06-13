"use client";

import { useState } from "react";

export default function HomePage() {
  const [text, setText] = useState("");
  const [renderedText, setRenderedText] = useState("");
  const [keywordData, setKeywordData] = useState<any[]>([]);
  const [modifiedText, setModifiedText] = useState("");
  const [loading, setLoading] = useState(false);

  const renderInteractiveText = (text: string, keywords: any[]) => {
    if (!keywords.length) return `<p>${text}</p>`;

    const sorted = [...keywords].sort((a, b) => a.start - b.start);
    let result = "";
    let cursor = 0;

    for (let i = 0; i < sorted.length; i++) {
      const kw = sorted[i];

      if (kw.start > cursor) {
        result += text.slice(cursor, kw.start);
      }

      const suggestions = kw.suggestions
        .filter((s: any) => s.text !== kw.text)
        .map(
          (s: any) =>
            `<span class="cursor-pointer px-4 py-2 hover:bg-indigo-700 hover:text-white transition-all border-b border-zinc-700" data-replace="${kw.text}" data-new="${s.text}">${s.text}</span>`
        )
        .join("");

      result += `
        <span class="relative group font-semibold text-cyan-400 decoration-dotted decoration-1 cursor-pointer hover:text-cyan-300 transition">
          ${kw.text}
          <div class="absolute hidden group-hover:flex flex-col -top-0 left-0 bg-zinc-800 text-white border border-cyan-600 rounded-lg shadow-xl z-50 max-w-xs overflow-hidden">
            ${suggestions}
          </div>
        </span>
      `;

      cursor = kw.end;
    }

    if (cursor < text.length) {
      result += text.slice(cursor);
    }

    return `<p class="text-lg leading-relaxed text-white">${result}</p>`;
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      setKeywordData(data.keywordData);
      setModifiedText(text);
      const interactiveHTML = renderInteractiveText(text, data.keywordData);
      setRenderedText(interactiveHTML);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (e: any) => {
    const target = e.target;
    if (!target || !target.dataset?.replace) return;

    const oldWord = target.dataset.replace;
    const newWord = target.dataset.new;

    const updated = modifiedText.replace(new RegExp(`\\b${oldWord}\\b`, "g"), newWord);
    setModifiedText(updated);

    const updatedHTML = renderInteractiveText(updated, keywordData);
    setRenderedText(updatedHTML);
  };

  return (
    <main
      className="min-h-screen p-6 md:p-8 bg-gradient-to-tr from-zinc-900 via-slate-900 to-black text-white font-[Inter] tracking-wide"
      onClick={handleSuggestionClick}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-transparent bg-clip-text drop-shadow-md">
          AI-Powered SEO Text Optimizer
        </h1>

        <textarea
          className="w-full p-4 bg-zinc-800 text-white border border-zinc-700 rounded-lg text-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none shadow-md"
          rows={8}
          placeholder="Paste your paragraph here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <button
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-500 hover:to-purple-600 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-xl transition"
        >
          {loading ? "Analyzing..." : "Analyze Text"}
        </button>

        {renderedText && (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-1/2 bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-inner">
              <h2 className="text-xl font-semibold text-cyan-300 mb-4">Interactive Suggestions</h2>
              <div
                dangerouslySetInnerHTML={{ __html: renderedText }}
                className="text-base space-y-2 space-x-2"
              />
              <p className="mt-3 text-sm text-zinc-400">
                *Hover over highlighted words to see smart suggestions.
              </p>
            </div>

            <div className="w-full lg:w-1/2 bg-zinc-800 border border-zinc-700 rounded-xl p-6 shadow-inner relative">
              <h2 className="text-xl font-semibold text-green-400 mb-3">Updated Output</h2>
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
              <textarea
                className="w-full p-4 bg-zinc-900 text-white border border-zinc-700 rounded-lg text-base shadow-md"
                rows={10}
                value={modifiedText}
                readOnly
              />
            </div>
          </div>
        )}

        {keywordData.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-inner mt-8">
            <h2 className="text-xl font-semibold text-yellow-300 mb-4">\ud83d\udd0d SEO Analyzer</h2>
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
                      <td className="p-2">{kw.text}</td>
                      <td className="p-2">{kw.score?.toFixed(4) ?? "-"}</td>
                      <td className="p-2 text-blue-400">
                        {kw.wikiLink ? (
                          <a href={kw.wikiLink} target="_blank" rel="noopener noreferrer">
                            Link \u2197
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2">{kw.wikidataId ?? "-"}</td>
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