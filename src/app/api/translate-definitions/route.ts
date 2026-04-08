import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { texts } = await req.json();
  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json({ translations: [] });
  }

  const prompt = `Translate each English definition to natural Korean. Return ONLY a JSON array of strings in the same order, no explanation.

Definitions:
${texts.map((t: string, i: number) => `${i + 1}. ${t}`).join("\n")}

Return format: ["한국어 번역1", "한국어 번역2", ...]`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";
  const match = raw.match(/\[[\s\S]*\]/);
  const translations = match ? JSON.parse(match[0]) : texts.map(() => "");

  return NextResponse.json({ translations });
}
