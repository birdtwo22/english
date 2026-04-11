"use client";

import { useEffect, useState, useCallback } from "react";
import { getWords, updateWordStats } from "@/lib/storage";
import { SavedWord } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, XCircle, RotateCcw, Square, Volume2, Loader2 } from "lucide-react";
import Link from "next/link";

interface Question {
  word: SavedWord;
  sentence: string;   // sentence with ___ replacing the word
  options: string[];
  correctAnswer: string;
}

async function getSentence(word: SavedWord): Promise<string> {
  // 1. Try stored example sentences first
  for (const meaning of word.meanings) {
    for (const def of meaning.definitions) {
      if (!def.example) continue;
      const regex = new RegExp(`\\b${word.word}\\b`, "i");
      if (regex.test(def.example)) {
        return def.example.replace(regex, "___");
      }
    }
  }

  // 2. Generate via AI
  try {
    const definition = word.meanings[0]?.definitions[0]?.definition ?? word.word;
    const res = await fetch("/api/quiz-sentence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: word.word, definition }),
    });
    const data = await res.json();
    if (data.sentence) {
      const regex = new RegExp(`\\b${word.word}\\b`, "i");
      if (regex.test(data.sentence)) {
        return data.sentence.replace(regex, "___");
      }
      // AI returned a sentence but word isn't in it exactly — append blank
      return data.sentence + " (___)";
    }
  } catch {
    // ignore
  }

  // 3. Last fallback — use definition
  return word.meanings[0]?.definitions[0]?.definition ?? word.word;
}

export default function QuizPage() {
  const [allWords, setAllWords] = useState<SavedWord[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const nextQuestion = useCallback(async (words: SavedWord[]) => {
    if (words.length < 2) return;
    setGenerating(true);
    setSelected(null);

    // Weight words by wrong rate — more wrong = higher chance
    const pool = words.flatMap((w) => {
      const wrong = w.quizCount - w.correctCount;
      const weight = wrong > 0 ? 1 + wrong * 2 : 1;
      return Array(weight).fill(w);
    });
    const word = pool[Math.floor(Math.random() * pool.length)];
    const sentence = await getSentence(word);

    const distractors = words
      .filter((w) => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((w) => w.word);
    const options = [...distractors, word.word].sort(() => Math.random() - 0.5);

    setQuestion({ word, sentence, options, correctAnswer: word.word });
    setGenerating(false);
  }, []);

  useEffect(() => {
    getWords().then((words) => {
      setAllWords(words);
      setLoading(false);
      if (words.length >= 2) nextQuestion(words);
    });
  }, [nextQuestion]);

  async function handleAnswer(option: string) {
    if (selected !== null || !question) return;
    setSelected(option);
    const correct = option === question.correctAnswer;
    if (correct) setScore((s) => s + 1);
    setTotal((t) => t + 1);
    await updateWordStats(question.word.id, correct);
  }

  function handleEnd() {
    setDone(true);
  }

  function handleRestart() {
    setScore(0);
    setTotal(0);
    setDone(false);
    nextQuestion(allWords);
  }

  if (loading) return null;

  if (allWords.length < 2) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center py-20">
        <Brain size={48} className="mx-auto mb-4 text-zinc-600" />
        <h2 className="text-xl font-semibold text-zinc-200 mb-2">단어가 부족해요</h2>
        <p className="text-zinc-400 text-sm mb-6">최소 2개 이상의 단어를 저장해야 퀴즈를 시작할 수 있어요.</p>
        <Link href="/search">
          <Button className="bg-violet-600 hover:bg-violet-500">단어 검색하기</Button>
        </Link>
      </div>
    );
  }

  if (done) {
    const percent = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold ${
            percent >= 80 ? "bg-emerald-600/20 text-emerald-400"
            : percent >= 50 ? "bg-amber-600/20 text-amber-400"
            : "bg-red-600/20 text-red-400"
          }`}>
            {percent}%
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">퀴즈 종료</h2>
          <p className="text-zinc-400 mb-8">{total}문제 중 {score}개 정답</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleRestart} className="bg-violet-600 hover:bg-violet-500">
              <RotateCcw size={16} className="mr-2" />
              다시 하기
            </Button>
            <Link href="/">
              <Button variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Quiz</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {total}문제 &middot; <span className="text-emerald-400">{score} 정답</span>
          </p>
        </div>
        <Button
          onClick={handleEnd}
          variant="outline"
          size="sm"
          className="bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/10 gap-2"
        >
          <Square size={13} />
          종료
        </Button>
      </div>

      {/* Question card */}
      <Card className="bg-zinc-900 border-zinc-800 mb-6 min-h-[160px]">
        <CardContent className="p-8">
          {generating || !question ? (
            <div className="flex items-center justify-center h-24 gap-2 text-zinc-500">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">예문 생성 중...</span>
            </div>
          ) : (
            <>
              <p className="text-zinc-400 text-sm mb-4">빈칸에 들어갈 단어를 고르세요</p>
              <p className="text-xl text-zinc-100 leading-relaxed font-medium">
                {question.sentence.split("___").map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className={`inline-block min-w-[100px] border-b-2 text-center align-bottom mx-1 px-2 ${
                        selected === null
                          ? "border-violet-500 text-violet-400"
                          : selected === question.correctAnswer
                          ? "border-emerald-500 text-emerald-400"
                          : "border-red-500 text-red-400"
                      }`}>
                        {selected !== null ? question.correctAnswer : ""}
                      </span>
                    )}
                  </span>
                ))}
              </p>
              {question.word.audioUrl && selected !== null && (
                <button
                  onClick={() => new Audio(question.word.audioUrl!).play()}
                  className="mt-4 flex items-center gap-2 text-zinc-500 hover:text-violet-400 text-sm transition-colors"
                >
                  <Volume2 size={14} />
                  발음 듣기
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {(question?.options ?? []).map((option) => {
          const isSelected = selected === option;
          const isCorrect = option === question?.correctAnswer;
          let style = "bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600";
          if (selected !== null) {
            if (isCorrect) style = "bg-emerald-600/15 border-emerald-500/40 text-emerald-300";
            else if (isSelected) style = "bg-red-600/15 border-red-500/40 text-red-300";
            else style = "bg-zinc-900 border-zinc-800 text-zinc-500";
          }
          return (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={selected !== null || generating}
              className={`w-full text-left px-5 py-4 rounded-xl border transition-all flex items-center justify-between ${style}`}
            >
              <span className="font-medium">{option}</span>
              {selected !== null && isCorrect && <CheckCircle size={18} className="text-emerald-400 shrink-0" />}
              {selected !== null && isSelected && !isCorrect && <XCircle size={18} className="text-red-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* After answer */}
      {selected !== null && question && (
        <div className="space-y-3">
          {(() => {
            const correct = selected === question.correctAnswer;
            const def = question.word.meanings[0]?.definitions[0];
            const pos = question.word.meanings[0]?.partOfSpeech;
            const korean = question.word.koreanTranslation;
            return (
              <div className={`rounded-xl p-4 border ${
                correct
                  ? "bg-emerald-600/10 border-emerald-600/30"
                  : "bg-red-600/10 border-red-600/30"
              }`}>
                <p className={`text-sm font-semibold mb-2 ${correct ? "text-emerald-400" : "text-red-400"}`}>
                  {correct ? "✓ 정답!" : `✗ 오답 — 정답은 "${question.correctAnswer}"`}
                </p>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-zinc-100 font-bold">{question.correctAnswer}</span>
                  {pos && (
                    <Badge className="bg-violet-600/20 text-violet-300 border-violet-600/30 text-xs">{pos}</Badge>
                  )}
                  {korean && <span className="text-violet-300 text-sm">{korean}</span>}
                </div>
                {(def?.koreanDefinition || def?.definition) && (
                  <p className="text-zinc-400 text-sm leading-relaxed">{def.koreanDefinition ?? def.definition}</p>
                )}
                {def?.example && (
                  <p className="text-zinc-500 text-xs italic mt-1.5 border-l-2 border-zinc-700 pl-2">
                    &ldquo;{def.example}&rdquo;
                  </p>
                )}
              </div>
            );
          })()}
          <Button
            onClick={() => nextQuestion(allWords)}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white"
          >
            다음 문제
          </Button>
        </div>
      )}
    </div>
  );
}
