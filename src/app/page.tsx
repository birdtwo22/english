"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWords, getStats } from "@/lib/storage";
import { SavedWord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Search, TrendingUp, Volume2, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    mastered: 0,
    needsReview: 0,
    weakWords: [] as SavedWord[],
    avgMastery: 0,
  });
  const [recentWords, setRecentWords] = useState<SavedWord[]>([]);
  const [allWords, setAllWords] = useState<SavedWord[]>([]);
  const [pickedWord, setPickedWord] = useState<SavedWord | null>(null);
  const [shownWrongIds, setShownWrongIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getStats().then(setStats);
    getWords().then((words) => {
      setRecentWords(words.slice(0, 6));
      setAllWords(words);
      if (words.length > 0) {
        const wrongWords = words.filter((w) => w.quizCount > 0 && w.quizCount - w.correctCount > 0);
        const first = wrongWords.length > 0
          ? wrongWords[Math.floor(Math.random() * wrongWords.length)]
          : words[Math.floor(Math.random() * words.length)];
        setPickedWord(first);
        if (wrongWords.length > 0) setShownWrongIds(new Set([first.id]));
      }
    });
  }, []);

  function pickRandom() {
    if (allWords.length === 0) return;
    const wrongWords = allWords.filter((w) => w.quizCount > 0 && w.quizCount - w.correctCount > 0);
    const unseenWrong = wrongWords.filter((w) => !shownWrongIds.has(w.id));

    if (unseenWrong.length > 0) {
      const next = unseenWrong[Math.floor(Math.random() * unseenWrong.length)];
      setPickedWord(next);
      setShownWrongIds((prev) => new Set([...prev, next.id]));
    } else {
      // All wrong words shown — pick from correct/unquizzed
      const others = allWords.filter((w) => !(w.quizCount > 0 && w.quizCount - w.correctCount > 0));
      const pool = others.length > 0 ? others : allWords;
      setPickedWord(pool[Math.floor(Math.random() * pool.length)]);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Your vocabulary progress at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center">
                <BookOpen size={16} className="text-violet-400" />
              </div>
              <span className="text-zinc-400 text-sm">Total Words</span>
            </div>
            <p className="text-3xl font-bold text-zinc-100">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                <TrendingUp size={16} className="text-emerald-400" />
              </div>
              <span className="text-zinc-400 text-sm">Mastered</span>
            </div>
            <p className="text-3xl font-bold text-zinc-100">{stats.mastered}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-600/20 flex items-center justify-center">
                <Brain size={16} className="text-amber-400" />
              </div>
              <span className="text-zinc-400 text-sm">Needs Review</span>
            </div>
            <p className="text-3xl font-bold text-zinc-100">{stats.needsReview}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <TrendingUp size={16} className="text-blue-400" />
              </div>
              <span className="text-zinc-400 text-sm">Avg Mastery</span>
            </div>
            <p className="text-3xl font-bold text-zinc-100">{stats.avgMastery}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Random word recommendation */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                오늘의 단어
              </span>
              {allWords.length > 1 && (
                <button
                  onClick={pickRandom}
                  className="text-zinc-500 hover:text-violet-400 transition-colors"
                >
                  <RefreshCw size={13} />
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!pickedWord ? (
              <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
                저장된 단어가 없어요
              </div>
            ) : (
              <Link href={`/vocabulary/${pickedWord.id}`} className="block group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-zinc-100 group-hover:text-violet-300 transition-colors">
                        {pickedWord.word}
                      </span>
                      {pickedWord.audioUrl && (
                        <button
                          onClick={(e) => { e.preventDefault(); new Audio(pickedWord.audioUrl!).play(); }}
                          className="text-zinc-500 hover:text-violet-400 transition-colors"
                        >
                          <Volume2 size={14} />
                        </button>
                      )}
                    </div>
                    {pickedWord.phonetic && (
                      <p className="text-zinc-500 text-xs mt-0.5">{pickedWord.phonetic}</p>
                    )}
                  </div>
                  <Badge className="text-xs bg-zinc-800 text-zinc-400 border-zinc-700 shrink-0">
                    {pickedWord.meanings[0]?.partOfSpeech}
                  </Badge>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-3">
                  {pickedWord.meanings[0]?.definitions[0]?.definition}
                </p>
                {pickedWord.meanings[0]?.definitions[0]?.example && (
                  <p className="text-zinc-500 text-xs italic mb-3">
                    &ldquo;{pickedWord.meanings[0].definitions[0].example}&rdquo;
                  </p>
                )}
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/search">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200"
              >
                <Search size={16} className="text-violet-400" />
                Search a new word
              </Button>
            </Link>
            <Link href="/quiz">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200"
              >
                <Brain size={16} className="text-amber-400" />
                Start quiz
                {stats.needsReview > 0 && (
                  <Badge className="ml-auto bg-amber-600/20 text-amber-400 border-0 text-xs">
                    {stats.needsReview} to review
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/vocabulary">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-200"
              >
                <BookOpen size={16} className="text-emerald-400" />
                My vocabulary
                {stats.total > 0 && (
                  <Badge className="ml-auto bg-zinc-700 text-zinc-300 border-0 text-xs">
                    {stats.total} words
                  </Badge>
                )}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent words */}
      {recentWords.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-zinc-300">Recently Added</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentWords.map((w) => (
                <div
                  key={w.id}
                  className="bg-zinc-800 rounded-xl p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-zinc-100">{w.word}</p>
                      {w.phonetic && (
                        <p className="text-zinc-500 text-xs">{w.phonetic}</p>
                      )}
                    </div>
                    {w.audioUrl && (
                      <button
                        onClick={() => new Audio(w.audioUrl!).play()}
                        className="text-zinc-500 hover:text-violet-400 transition-colors"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-zinc-400 text-xs line-clamp-2">
                    {w.meanings[0]?.definitions[0]?.definition}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.total === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <BookOpen size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium text-zinc-400">Start building your vocabulary</p>
          <p className="text-sm mt-2 mb-6">Search for a word and save it to get started</p>
          <Link href="/search">
            <Button className="bg-violet-600 hover:bg-violet-500">
              <Search size={16} className="mr-2" />
              Search a word
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
