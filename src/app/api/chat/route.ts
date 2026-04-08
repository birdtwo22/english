import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `You are an English vocabulary assistant for a Korean UX/UI designer preparing for overseas job applications. 
The user will ask about English words or phrases (in English or Korean).
Always respond in Korean for explanations, but keep English words/examples in English.

Return ONLY valid JSON, no markdown, no extra text:
{
  "word": "the English word or phrase",
  "pos": "part of speech (noun/verb/adjective/phrase/idiom/etc)",
  "korean": "한국어 뜻 (간결하게)",
  "meaning": "English definition (1-2 sentences)",
  "example1": "natural example sentence in UX/UI or career context",
  "example2": "another natural example sentence",
  "tip": "1 sentence career tip for an overseas job-seeking designer",
  "synonyms": ["synonym1", "synonym2"],
  "reply": "친근하고 자연스러운 한국어 설명 (뜻, 예문 포인트, 취업 팁 포함, 3-5문장)"
}

If the user asks something that is NOT about vocabulary (e.g. general questions), still return valid JSON but set word to null and put a helpful Korean response in the reply field.`,
        },
        { role: "user", content: message },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Parse error" }, { status: 500 });

    const data = JSON.parse(match[0]);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
