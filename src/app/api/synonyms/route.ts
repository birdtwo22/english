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
          content: `한국어 단어 또는 표현 "${query}"의 뉘앙스를 커버하는 영어 단어/표현을 3~5개 알려줘.
각 단어마다 한국어로 뉘앙스 차이를 15자 이내로 설명하고, 짧은 영어 예문 1개를 제시해줘.

반드시 아래 JSON 형식만 반환해 (다른 텍스트 없이):
[
  { "word": "영어단어", "nuance": "한국어 뉘앙스 설명", "example": "Short English example." }
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
