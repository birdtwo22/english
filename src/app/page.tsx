"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWords, getStats } from "@/lib/storage";
import { SavedWord } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BookOpen, Brain, Search, TrendingUp, Volume2 } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    mastered: 0,
    needsReview: 0,
    weakWords: [] as SavedWord[],
    avgMastery: 0,
  });
  const [recentWords, setRecentWords] = useState<SavedWord[]>([]);

  useEffect(() => {
    getStats().then(setStats);
    getWords().then((words) => setRecentWords(words.slice(0, 6)));
  }, []);

  const chartData = stats.weakWords.map((w) => ({
    word: w.word,
    mastery: w.masteryLevel,
  }));

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
        {/* Weak words chart */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Words You Struggle With
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
                Take a quiz to see your weak words
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={20}>
                  <XAxis
                    dataKey="word"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v) => [`${v}%`, "Mastery"]}
                  />
                  <Bar dataKey="mastery" radius={4}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.mastery < 30
                            ? "#ef4444"
                            : entry.mastery < 60
                            ? "#f59e0b"
                            : "#10b981"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
                  {w.quizCount > 0 && (
                    <div className="mt-1">
                      <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>Mastery</span>
                        <span>{w.masteryLevel}%</span>
                      </div>
                      <Progress value={w.masteryLevel} className="h-1" />
                    </div>
                  )}
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
