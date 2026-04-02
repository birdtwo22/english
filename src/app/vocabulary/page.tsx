"use client";

import { useEffect, useState } from "react";
import { getWords, deleteWord } from "@/lib/storage";
import { SavedWord } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen } from "lucide-react";
import Link from "next/link";

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

  function WordCard({ w }: { w: SavedWord }) {
    return (
      <Link href={`/vocabulary/${w.id}`}>
        <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center gap-4">
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
          </CardContent>
        </Card>
      </Link>
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
