"use client";

import { useEffect, useState } from "react";
import { getWords, deleteWord } from "@/lib/storage";
import { SavedWord } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Volume2, Trash2, BookOpen, ChevronDown, ChevronUp } from "lucide-react";

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function groupByDate(words: SavedWord[]): { label: string; words: SavedWord[] }[] {
  const map = new Map<string, SavedWord[]>();
  for (const w of words) {
    const label = formatDateLabel(w.savedAt);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(w);
  }
  return Array.from(map.entries()).map(([label, words]) => ({ label, words }));
}

export default function VocabularyPage() {
  const [words, setWords] = useState<SavedWord[]>([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "mastery" | "alpha">("date");

  useEffect(() => {
    getWords().then(setWords);
  }, []);

  async function handleDelete(id: string) {
    await deleteWord(id);
    getWords().then(setWords);
  }

  const filtered = words
    .filter((w) => w.word.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "mastery") return a.masteryLevel - b.masteryLevel;
      if (sortBy === "alpha") return a.word.localeCompare(b.word);
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });

  const grouped = sortBy === "date" ? groupByDate(filtered) : null;

  const masteryColor = (level: number) => {
    if (level >= 80) return "text-emerald-400";
    if (level >= 50) return "text-amber-400";
    return "text-red-400";
  };

  function WordCard({ w }: { w: SavedWord }) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
        <CardContent className="p-0">
          <button
            className="w-full text-left p-4 flex items-center gap-4"
            onClick={() => setExpanded(expanded === w.id ? null : w.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-zinc-100">{w.word}</span>
                {w.phonetic && (
                  <span className="text-zinc-500 text-xs">{w.phonetic}</span>
                )}
                <Badge className="text-xs bg-zinc-800 text-zinc-400 border-zinc-700">
                  {w.meanings[0]?.partOfSpeech}
                </Badge>
              </div>
              <p className="text-zinc-400 text-sm truncate">
                {w.meanings[0]?.definitions[0]?.definition}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {w.quizCount > 0 && (
                <div className="text-right w-20">
                  <p className={`text-sm font-semibold ${masteryColor(w.masteryLevel)}`}>
                    {w.masteryLevel}%
                  </p>
                  <Progress value={w.masteryLevel} className="h-1 mt-1 w-20" />
                </div>
              )}
              {expanded === w.id ? (
                <ChevronUp size={16} className="text-zinc-500" />
              ) : (
                <ChevronDown size={16} className="text-zinc-500" />
              )}
            </div>
          </button>

          {expanded === w.id && (
            <div className="px-4 pb-4 pt-0 border-t border-zinc-800">
              <div className="pt-4 space-y-3">
                {w.meanings.map((m, mi) => (
                  <div key={mi}>
                    <Badge className="mb-2 text-xs bg-violet-600/20 text-violet-300 border-violet-600/30">
                      {m.partOfSpeech}
                    </Badge>
                    {m.definitions.slice(0, 2).map((d, di) => (
                      <div key={di} className="pl-3 border-l-2 border-zinc-700 mb-2">
                        <p className="text-zinc-300 text-sm">{d.definition}</p>
                        {d.example && (
                          <p className="text-zinc-500 text-xs mt-1 italic">
                            &ldquo;{d.example}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2 text-xs text-zinc-500">
                    {w.quizCount > 0 && (
                      <span>{w.correctCount}/{w.quizCount} correct</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {w.audioUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => new Audio(w.audioUrl!).play()}
                        className="bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                      >
                        <Volume2 size={14} />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(w.id)}
                      className="bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Vocabulary</h1>
        <p className="text-zinc-400 text-sm mt-1">{words.length} words saved</p>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter words..."
            className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-violet-500"
          />
        </div>
        <div className="flex gap-2">
          {(["date", "mastery", "alpha"] as const).map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => setSortBy(s)}
              className={
                sortBy === s
                  ? "bg-violet-600/20 border-violet-600/40 text-violet-300"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }
            >
              {s === "date" ? "By Date" : s === "mastery" ? "Weakest" : "A-Z"}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-zinc-400">
            {words.length === 0 ? "No words saved yet" : "No words match your search"}
          </p>
        </div>
      ) : grouped ? (
        <div className="space-y-6">
          {grouped.map(({ label, words: group }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {label}
                </span>
                <span className="text-xs text-zinc-600">{group.length} words</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
              <div className="space-y-2">
                {group.map((w) => <WordCard key={w.id} w={w} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((w) => <WordCard key={w.id} w={w} />)}
        </div>
      )}
    </div>
  );
}
