import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface SynonymOption {
  word: string;
  nuance: string;
  example: string;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: "No query" }, { status: 400 });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `You are a bilingual Korean-English dictionary assistant.

The user searched for the Korean word/expression: "${query}"

List 3-5 English words that cover the nuances of "${query}". Each must be a real English word (NOT Korean).

For each English word, provide:
- "word": the English word only (e.g. "appropriate", "suitable") — MUST be English
- "nuance": a short Korean explanation of how this word differs (under 20 chars)
- "example": one short English example sentence using the word

Return ONLY a JSON array, no other text:
[
  { "word": "appropriate", "nuance": "격식적이고 공식적인 상황", "example": "That is an appropriate response." }
]`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json({ error: "No JSON in response" }, { status: 500 });

    const options: SynonymOption[] = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ options });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/synonyms]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
