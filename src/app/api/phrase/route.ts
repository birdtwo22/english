import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { DictionaryEntry } from "@/types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { phrase } = await req.json();
    if (!phrase) return NextResponse.json({ error: "No phrase" }, { status: 400 });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Explain the English phrase or expression: "${phrase}"

Return ONLY valid JSON (no other text, no markdown):
{
  "korean": "Korean translation of the phrase (concise, e.g. ~로 만들어지다)",
  "partOfSpeech": "one of: phrasal verb / idiom / phrase / expression",
  "definitions": [
    { "definition": "Clear English definition", "example": "English example sentence using the phrase." },
    { "definition": "Another meaning if applicable", "example": "Another English example." }
  ],
  "synonyms": ["similar English expression 1", "similar English expression 2"],
  "antonyms": []
}

Rules:
- definitions[].definition must be in English
- definitions[].example must be a natural English sentence
- korean field must be in Korean
- synonyms must be English`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Parse error" }, { status: 500 });

    const data = JSON.parse(jsonMatch[0]);

    const entry: DictionaryEntry = {
      word: phrase,
      phonetics: [],
      meanings: [
        {
          partOfSpeech: data.partOfSpeech ?? "phrase",
          definitions: data.definitions ?? [],
          synonyms: data.synonyms ?? [],
          antonyms: data.antonyms ?? [],
        },
      ],
    };

    return NextResponse.json({ entry, korean: data.korean ?? null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/phrase]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
