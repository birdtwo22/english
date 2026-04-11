"use client";

import { useState, useRef, useEffect } from "react";
import { saveWord, isWordSaved, deleteWord } from "@/lib/storage";
import { SavedWord, Meaning } from "@/types";
import { Send, BookmarkPlus, BookmarkCheck, Loader2, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface WordData {
  word: string | null;
  pos?: string;
  korean?: string;
  meaning?: string;
  example1?: string;
  example2?: string;
  tip?: string;
  synonyms?: string[];
  reply: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  wordData?: WordData;
  saved?: boolean;
  savedWordId?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      text: "안녕하세요 세의! 궁금한 영어 단어나 구문을 물어보세요. 설명해드리고 바로 단어장에 저장할 수 있어요 ✦",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data: WordData = await res.json();

      let alreadySavedId: string | null = null;
      if (data.word) {
        alreadySavedId = await isWordSaved(data.word);
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: data.reply,
        wordData: data.word ? data : undefined,
        saved: !!alreadySavedId,
        savedWordId: alreadySavedId ?? undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", text: "오류가 발생했어요. 다시 시도해주세요." },
      ]);
    }
    setLoading(false);
  }

  async function handleSave(msgId: string, wordData: WordData) {
    if (!wordData.word) return;

    const definitions = [];
    if (wordData.meaning) {
      definitions.push({
        definition: wordData.meaning,
        example: wordData.example1 || undefined,
        synonyms: wordData.synonyms ?? [],
        koreanDefinition: wordData.korean || undefined,
      });
    }
    if (wordData.example2) {
      definitions.push({ definition: wordData.meaning ?? "", example: wordData.example2 });
    }

    const meanings: Meaning[] = [{
      partOfSpeech: wordData.pos ?? "unknown",
      definitions,
      synonyms: wordData.synonyms ?? [],
    }];

    const saved: SavedWord = {
      id: crypto.randomUUID(),
      word: wordData.word.toLowerCase().trim(),
      meanings,
      savedAt: new Date().toISOString(),
      masteryLevel: 0,
      quizCount: 0,
      correctCount: 0,
      koreanTranslation: wordData.korean || undefined,
    };

    await saveWord(saved);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, saved: true, savedWordId: saved.id } : m))
    );
  }

  async function handleUnsave(msgId: string, savedWordId: string) {
    await deleteWord(savedWordId);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, saved: false, savedWordId: undefined } : m))
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b border-zinc-800 px-8 py-4 flex items-center gap-3 bg-zinc-950">
        <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
          <Sparkles size={15} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-zinc-100">Vocab Chat</h1>
          <p className="text-xs text-zinc-500">단어 물어보고 바로 저장</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0 mt-1">
                <Bot size={13} className="text-violet-400" />
              </div>
            )}
            <div className={`max-w-lg ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-3`}>
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet-600 text-white rounded-tr-sm"
                  : "bg-zinc-900 text-zinc-200 rounded-tl-sm border border-zinc-800"
              }`}>
                {msg.text}
              </div>

              {msg.wordData?.word && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 w-full space-y-3">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xl font-bold text-zinc-100">{msg.wordData.word}</span>
                    {msg.wordData.pos && (
                      <Badge className="bg-violet-600/20 text-violet-300 border-violet-600/30 text-xs">
                        {msg.wordData.pos}
                      </Badge>
                    )}
                    {msg.wordData.korean && (
                      <span className="text-sm text-violet-300">{msg.wordData.korean}</span>
                    )}
                  </div>
                  {msg.wordData.meaning && (
                    <p className="text-xs text-zinc-400 leading-relaxed">{msg.wordData.meaning}</p>
                  )}
                  {(msg.wordData.example1 || msg.wordData.example2) && (
                    <div className="space-y-1.5">
                      {[msg.wordData.example1, msg.wordData.example2].filter(Boolean).map((ex, i) => (
                        <p key={i} className="text-xs text-zinc-500 italic border-l-2 border-zinc-700 pl-2">
                          &ldquo;{ex}&rdquo;
                        </p>
                      ))}
                    </div>
                  )}
                  {msg.wordData.tip && (
                    <p className="text-xs text-amber-400/80">💡 {msg.wordData.tip}</p>
                  )}
                  {(msg.wordData.synonyms?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.wordData.synonyms!.map((s) => (
                        <span key={s} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">{s}</span>
                      ))}
                    </div>
                  )}
                  <Button
                    onClick={() =>
                      msg.saved && msg.savedWordId
                        ? handleUnsave(msg.id, msg.savedWordId)
                        : handleSave(msg.id, msg.wordData!)
                    }
                    size="sm"
                    className={`w-full mt-1 ${
                      msg.saved
                        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-zinc-700/40 hover:text-zinc-300 hover:border-zinc-600"
                        : "bg-violet-600 hover:bg-violet-500 text-white"
                    }`}
                  >
                    {msg.saved ? (
                      <><BookmarkCheck size={13} className="mr-1.5" /> 저장됨</>
                    ) : (
                      <><BookmarkPlus size={13} className="mr-1.5" /> 단어장에 저장</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full bg-violet-600/20 flex items-center justify-center shrink-0">
              <Bot size={13} className="text-violet-400" />
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 size={14} className="animate-spin text-zinc-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-zinc-800 px-8 py-4 bg-zinc-950">
        <form onSubmit={handleSend} className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="단어나 구문을 물어보세요 (영어 or 한글)..."
            className="bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-violet-500"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-500 text-white shrink-0"
          >
            <Send size={15} />
          </Button>
        </form>
      </div>
    </div>
  );
}
