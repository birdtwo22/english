"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { lookupWord, getAudioUrl, getPhoneticText } from "@/lib/dictionary";
import { translateToKorean, isKorean } from "@/lib/translate";
import { saveWord, isWordSaved, deleteWord } from "@/lib/storage";
import { DictionaryEntry, SavedWord } from "@/types";
import { SynonymOption } from "@/app/api/synonyms/route";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Volume2,
  BookmarkPlus,
  BookmarkCheck,
  Loader2,
  MessageSquareQuote,
  ArrowRight,
} from "lucide-react";

type Stage =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "synonym-select"; query: string; options: SynonymOption[] }
  | { type: "result"; entries: DictionaryEntry[]; korean: string | null; resolvedWord: string | null };

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [stage, setStage] = useState<Stage>({ type: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedWordId, setSavedWordId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const doSearch = useCallback(async (input: string) => {
    setError(null);
    setSaved(false);
    setSavedWordId(null);
    setStage({ type: "loading" });

    try {
      if (isKorean(input)) {
        // Korean → show nuanced synonym picker
        const res = await fetch("/api/synonyms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: input }),
        });
        const data = await res.json();
        if (!res.ok || !data.options) throw new Error(data.error ?? "Failed to get synonyms");
        setStage({ type: "synonym-select", query: input, options: data.options });
      } else if (input.trim().includes(" ")) {
        // Multi-word phrase → AI lookup
        await lookupPhrase(input.trim());
      } else {
        await lookupEnglishWord(input);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage({ type: "idle" });
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, [searchParams, doSearch]);

  async function lookupPhrase(phrase: string) {
    const res = await fetch("/api/phrase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phrase }),
    });
    const data = await res.json();
    if (!res.ok || !data.entry) throw new Error(data.error ?? "Failed to look up phrase");
    setStage({
      type: "result",
      entries: [data.entry],
      korean: data.korean ?? null,
      resolvedWord: null,
    });
    const existingId = await isWordSaved(phrase);
    setSaved(!!existingId);
    setSavedWordId(existingId);
  }

  async function lookupEnglishWord(word: string, resolvedFrom?: string) {
    const [entries, korean] = await Promise.all([
      lookupWord(word),
      translateToKorean(word),
    ]);

    // Translate all definitions to Korean
    const allDefs = entries.flatMap((e) =>
      e.meanings.flatMap((m) => m.definitions.map((d) => d.definition))
    );
    let translations: string[] = [];
    try {
      const res = await fetch("/api/translate-definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: allDefs }),
      });
      const data = await res.json();
      translations = data.translations ?? [];
    } catch {}

    // Inject koreanDefinition into each definition
    let idx = 0;
    const translatedEntries = entries.map((e) => ({
      ...e,
      meanings: e.meanings.map((m) => ({
        ...m,
        definitions: m.definitions.map((d) => ({
          ...d,
          koreanDefinition: translations[idx++] || undefined,
        })),
      })),
    }));

    setStage({
      type: "result",
      entries: translatedEntries,
      korean,
      resolvedWord: resolvedFrom ?? null,
    });
    const existingId = await isWordSaved(word);
    setSaved(!!existingId);
    setSavedWordId(existingId);
  }

  async function handleSelectSynonym(option: SynonymOption) {
    setError(null);
    router.push(`/search?q=${encodeURIComponent(option.word)}`);
  }

  async function handleSave() {
    if (stage.type !== "result") return;
    const entry = stage.entries[0];
    const id = crypto.randomUUID();
    const word: SavedWord = {
      id,
      word: entry.word,
      phonetic: getPhoneticText(stage.entries),
      audioUrl: getAudioUrl(stage.entries),
      meanings: entry.meanings,
      savedAt: new Date().toISOString(),
      masteryLevel: 0,
      quizCount: 0,
      correctCount: 0,
      koreanTranslation: stage.korean ?? undefined,
    };
    await saveWord(word);
    setSaved(true);
    setSavedWordId(id);
  }

  async function handleUnsave() {
    if (!savedWordId) return;
    await deleteWord(savedWordId);
    setSaved(false);
    setSavedWordId(null);
  }

  // Derived values for result stage
  const entries = stage.type === "result" ? stage.entries : [];
  const phonetic = entries.length ? getPhoneticText(entries) : null;
  const hasAudio = entries.length ? !!getAudioUrl(entries) : false;
  const allExamples: string[] = [];
  if (entries.length) {
    for (const meaning of entries[0].meanings) {
      for (const def of meaning.definitions) {
        if (def.example) allExamples.push(def.example);
      }
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Search</h1>
        <p className="text-zinc-400 text-sm mt-1">단어, 구문, 한글로 검색하세요</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="단어, 구문 검색 (영어 or 한글)..."
            className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-violet-500"
          />
        </div>
        <Button
          type="submit"
          disabled={stage.type === "loading"}
          className="bg-violet-600 hover:bg-violet-500 text-white"
        >
          {stage.type === "loading" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            "Search"
          )}
        </Button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Synonym picker */}
      {stage.type === "synonym-select" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-zinc-400 text-sm">
              <span className="text-zinc-200 font-medium">&ldquo;{stage.query}&rdquo;</span>
              에 맞는 단어를 선택하세요
            </span>
          </div>
          {stage.options.map((opt) => (
            <button
              key={opt.word}
              onClick={() => handleSelectSynonym(opt)}
              className="w-full text-left bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-zinc-400 text-sm">{opt.nuance}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-zinc-100">{opt.word}</span>
                  </div>
                  <p className="text-zinc-500 text-xs mt-1 italic">&ldquo;{opt.example}&rdquo;</p>
                </div>
                <ArrowRight
                  size={16}
                  className="text-zinc-600 group-hover:text-violet-400 transition-colors shrink-0 ml-3"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Dictionary result */}
      {stage.type === "result" && entries.length > 0 && (
        <div className="space-y-5">
          {/* Korean → English indicator */}
          {stage.resolvedWord && (
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span className="bg-zinc-800 px-2 py-1 rounded-md">{stage.resolvedWord}</span>
              <span className="text-zinc-600">→</span>
              <span className="bg-violet-600/20 text-violet-300 px-2 py-1 rounded-md">
                {entries[0].word}
              </span>
              <button
                className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2"
                onClick={async () => {
                  const kQuery = stage.resolvedWord!;
                  setStage({ type: "loading" });
                  const res = await fetch("/api/synonyms", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: kQuery }),
                  });
                  const data = await res.json();
                  setStage({ type: "synonym-select", query: kQuery, options: data.options });
                }}
              >
                다른 단어 보기
              </button>
            </div>
          )}

          {/* Word header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="text-3xl font-bold text-zinc-100">{entries[0].word}</h2>
                {phonetic && <span className="text-zinc-400 text-sm">{phonetic}</span>}
              </div>
              {stage.korean && (
                <p className="mt-2 text-lg font-medium text-violet-300">{stage.korean}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {hasAudio && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => new Audio(getAudioUrl(entries)!).play()}
                  className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                >
                  <Volume2 size={16} />
                </Button>
              )}
              <Button
                onClick={saved ? handleUnsave : handleSave}
                className={
                  saved
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 hover:bg-zinc-700/40 hover:text-zinc-300 hover:border-zinc-600"
                    : "bg-violet-600 hover:bg-violet-500 text-white"
                }
              >
                {saved ? (
                  <><BookmarkCheck size={16} className="mr-2" />Saved</>
                ) : (
                  <><BookmarkPlus size={16} className="mr-2" />Save word</>
                )}
              </Button>
            </div>
          </div>

          {/* Meanings */}
          {entries[0].meanings.map((meaning, mi) => (
            <Card key={mi} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <Badge className="mb-4 bg-violet-600/20 text-violet-300 border-violet-600/30 text-xs">
                  {meaning.partOfSpeech}
                </Badge>
                <div className="space-y-4">
                  {meaning.definitions.slice(0, 3).map((def, di) => (
                    <div key={di} className="pl-3 border-l-2 border-zinc-700">
                      <p className="text-zinc-200 text-sm leading-relaxed">
                        <span className="text-zinc-500 text-xs mr-2">{di + 1}.</span>
                        {def.koreanDefinition ?? def.definition}
                      </p>
                      {def.koreanDefinition && (
                        <p className="text-zinc-500 text-xs mt-0.5">{def.definition}</p>
                      )}
                    </div>
                  ))}
                </div>
                {(meaning.synonyms?.length ?? 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-zinc-800">
                    <p className="text-zinc-500 text-xs mb-2">Synonyms</p>
                    <div className="flex flex-wrap gap-2">
                      {meaning.synonyms!.slice(0, 6).map((s) => (
                        <button
                          key={s}
                          onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
                          className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded-md transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Example sentences */}
          {allExamples.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquareQuote size={15} className="text-amber-400" />
                  <span className="text-sm font-medium text-zinc-300">Example Sentences</span>
                </div>
                <div className="space-y-3">
                  {allExamples.map((ex, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className="mt-1 w-5 h-5 rounded-full bg-amber-600/20 text-amber-400 text-xs flex items-center justify-center shrink-0 font-medium">
                        {i + 1}
                      </span>
                      <p className="text-zinc-200 text-sm leading-relaxed italic">
                        &ldquo;{ex}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
