import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const apiKey = process.env.TEXTRAZOR_API_KEY;

  // Validate presence of API key
  if (!apiKey) {
    return NextResponse.json({ error: "Missing TextRazor API key" }, { status: 500 });
  }

  // Send text to TextRazor API for analysis
  const razorRes = await fetch("https://api.textrazor.com/", {
    method: "POST",
    headers: {
      "x-textrazor-key": apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      extractors: "entities,topics,words,phrases",
      text,
    }),
  });

  const data = await razorRes.json();
  const response = data.response;

  const seen = new Set<string>();

  // Parse and filter useful entities (excluding dates/times)
  const keywordData = (response.entities || [])
    .filter((ent: any) => ent.type && !ent.type.includes("Date") && !ent.type.includes("Time"))
    .sort((a: any, b: any) => b.matchedText.length - a.matchedText.length) // Longest entities first
    .map((ent: any) => {
      const matchedText = ent.matchedText;
      const start = ent.start;
      const end = ent.end;
      const score = ent.relevanceScore || ent.confidenceScore || 0.5;

      const key = `${start}-${end}-${matchedText}`;
      if (seen.has(key)) return null;
      seen.add(key);

      const wikiTitle = ent.wikipediaLink ? decodeURIComponent(ent.wikipediaLink.split('/').pop()) : "";

      // Build suggestion list with synonyms, wiki title, etc.
      const suggestions = Array.from(
        new Set([
          matchedText,
          ...(ent.synonyms || []),
          wikiTitle,
          ent.entityId || "",
        ])
      )
        .filter((s) => s && s.trim())
        .map((s) => ({ text: s }));

      return {
        text: matchedText,
        start,
        end,
        score,
        suggestions,
        wikiLink: ent.wikipediaLink || "",
        wikidataId: ent.wikidataId || "",
      };
    })
    .filter(Boolean);

  // Send keyword data and full response for optional debugging
  return NextResponse.json({
    keywordData,
    analysis: response,
  });
}
