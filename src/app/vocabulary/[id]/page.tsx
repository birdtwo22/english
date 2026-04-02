"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getWords, deleteWord } from "@/lib/storage";
import { SavedWord } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Volume2,
  Trash2,
  BookOpen,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export default function WordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [word, setWord] = useState<SavedWord | null>(null);

  useEffect(() => {
    getWords().then((words) => {
      setWord(words.find((w) => w.id === id) ?? null);
    });
  }, [id]);

  async function handleDelete() {
    if (!word) return;
    await deleteWord(word.id);
    router.push("/vocabulary");
  }

  if (!word) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center py-20">
        <BookOpen size={40} className="mx-auto mb-4 text-zinc-600" />
        <p className="text-zinc-400">Word not found</p>
        <Link href="/vocabulary">
          <Button variant="outline" className="mt-4 bg-zinc-900 border-zinc-700 text-zinc-300">
            Back to Vocabulary
          </Button>
        </Link>
      </div>
    );
  }

  const wrongCount = word.quizCount - word.correctCount;

  const allSynonyms = [
    ...word.meanings.flatMap((m) => [
      ...(m.synonyms ?? []),
      ...m.definitions.flatMap((d) => d.synonyms ?? []),
    ]),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 12);

  const allAntonyms = [
    ...word.meanings.flatMap((m) => [
      ...(m.antonyms ?? []),
      ...m.definitions.flatMap((d) => d.antonyms ?? []),
    ]),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 12);

  const allExamples = word.meanings
    .flatMap((m) => m.definitions.map((d) => d.example))
    .filter(Boolean) as string[];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/vocabulary"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-sm mb-8 transition-colors"
      >
        <ArrowLeft size={15} />
        Vocabulary
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-zinc-100">{word.word}</h1>
          {word.phonetic && (
            <p className="text-zinc-400 text-sm mt-1">{word.phonetic}</p>
          )}
          <p className="text-zinc-500 text-xs mt-2">
            Saved {new Date(word.savedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {word.audioUrl && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => new Audio(word.audioUrl!).play()}
              className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            >
              <Volume2 size={16} />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleDelete}
            className="bg-zinc-900 border-zinc-700 hover:bg-red-400/10 hover:border-red-400/30 hover:text-red-400 text-zinc-400"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {/* Quiz stats */}
      {word.quizCount > 0 && wrongCount > 0 && (
        <div className="mb-6">
          <Badge className="bg-red-600/15 text-red-400 border-red-600/25">
            <XCircle size={12} className="mr-1" />
            {wrongCount}번 틀림 · {word.quizCount}번 시도
          </Badge>
        </div>
      )}

      {/* Meanings */}
      <div className="space-y-4 mb-6">
        {word.meanings.map((m, mi) => (
          <Card key={mi} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-5">
              <Badge className="mb-4 bg-violet-600/20 text-violet-300 border-violet-600/30 text-xs">
                {m.partOfSpeech}
              </Badge>
              <div className="space-y-4">
                {m.definitions.map((d, di) => (
                  <div key={di} className="pl-3 border-l-2 border-zinc-700">
                    <p className="text-zinc-200 text-sm leading-relaxed">
                      <span className="text-zinc-500 text-xs mr-2">{di + 1}.</span>
                      {d.definition}
                    </p>
                    {d.example && (
                      <p className="text-zinc-500 text-xs mt-1 italic">
                        &ldquo;{d.example}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Synonyms & Antonyms */}
      {(allSynonyms.length > 0 || allAntonyms.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {allSynonyms.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Synonyms</p>
                <div className="flex flex-wrap gap-2">
                  {allSynonyms.map((s) => (
                    <span key={s} className="text-xs bg-emerald-600/10 text-emerald-400 border border-emerald-600/20 px-2 py-1 rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {allAntonyms.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Antonyms</p>
                <div className="flex flex-wrap gap-2">
                  {allAntonyms.map((a) => (
                    <span key={a} className="text-xs bg-red-600/10 text-red-400 border border-red-600/20 px-2 py-1 rounded-lg">
                      {a}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Example sentences */}
      {allExamples.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Examples</p>
            <div className="space-y-3">
              {allExamples.map((ex, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-amber-600/20 text-amber-400 text-xs flex items-center justify-center shrink-0 font-medium">
                    {i + 1}
                  </span>
                  <p className="text-zinc-300 text-sm leading-relaxed italic">&ldquo;{ex}&rdquo;</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
