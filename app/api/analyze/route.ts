import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const apiKey = process.env.TEXTRAZOR_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Missing TextRazor API key" }, { status: 500 });
  }

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
  const keywordData =
    (response.entities || []).map((ent: any) => {
      const matchedText = ent.matchedText;
      const start = ent.start;
      const end = ent.end;
      const score = ent.relevanceScore || ent.confidenceScore || 0.5;

      const key = `${start}-${end}-${matchedText}`;
      if (seen.has(key)) return null;
      seen.add(key);

      const suggestions = [
        { text: matchedText },
        ...(ent.synonyms || []).map((syn: string) => ({ text: syn })),
        ...(ent.entityId ? [{ text: ent.entityId }] : []),
      ];

      return {
        text: matchedText,
        start,
        end,
        score,
        suggestions,
      };
    }).filter(Boolean);

  return NextResponse.json({
    keywordData,
    analysis: response,
  });
}
