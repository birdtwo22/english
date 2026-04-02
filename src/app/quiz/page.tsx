"use client";

import { useEffect, useState, useCallback } from "react";
import { getWords, updateWordStats } from "@/lib/storage";
import { SavedWord, QuizQuestion } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, XCircle, RotateCcw, Volume2 } from "lucide-react";
import Link from "next/link";

function buildQuiz(words: SavedWord[]): QuizQuestion[] {
  if (words.length < 2) return [];

  return words
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(10, words.length))
    .map((word) => {
      const definition = word.meanings[0]?.definitions[0]?.definition ?? "";
      const distractors = words
        .filter((w) => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.word);

      const options = [...distractors, word.word].sort(() => Math.random() - 0.5);
      return {
        word,
        correctAnswer: word.word,
        options,
        questionType: "word" as const,
        definition,
      };
    });
}

type ExtendedQuestion = QuizQuestion & { definition: string };

export default function QuizPage() {
  const [questions, setQuestions] = useState<ExtendedQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const startQuiz = useCallback(async () => {
    const words = await getWords();
    setWordCount(words.length);
    const q = buildQuiz(words) as ExtendedQuestion[];
    setQuestions(q);
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setDone(false);
  }, []);

  useEffect(() => {
    startQuiz();
  }, [startQuiz]);

  async function handleAnswer(option: string) {
    if (selected !== null) return;
    setSelected(option);

    const q = questions[current];
    const correct = option === q.correctAnswer;
    if (correct) setScore((s) => s + 1);
    await updateWordStats(q.word.id, correct);
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }

  if (wordCount < 2) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center py-20">
        <Brain size={48} className="mx-auto mb-4 text-zinc-600" />
        <h2 className="text-xl font-semibold text-zinc-200 mb-2">Not enough words</h2>
        <p className="text-zinc-400 text-sm mb-6">
          You need at least 2 saved words to start a quiz.
        </p>
        <Link href="/search">
          <Button className="bg-violet-600 hover:bg-violet-500">Search words</Button>
        </Link>
      </div>
    );
  }

  if (done) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <div
            className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-bold ${
              percent >= 80
                ? "bg-emerald-600/20 text-emerald-400"
                : percent >= 50
                ? "bg-amber-600/20 text-amber-400"
                : "bg-red-600/20 text-red-400"
            }`}
          >
            {percent}%
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">Quiz Complete</h2>
          <p className="text-zinc-400 mb-8">
            {score} out of {questions.length} correct
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={startQuiz}
              className="bg-violet-600 hover:bg-violet-500"
            >
              <RotateCcw size={16} className="mr-2" />
              Try again
            </Button>
            <Link href="/">
              <Button
                variant="outline"
                className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return null;

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold text-zinc-100">Quiz</h1>
          <span className="text-zinc-400 text-sm">
            {current + 1} / {questions.length}
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardContent className="p-8">
          <p className="text-zinc-400 text-sm mb-2">What word matches this definition?</p>
          <p className="text-xl text-zinc-100 leading-relaxed font-medium">
            &ldquo;{q.definition}&rdquo;
          </p>
          {q.word.audioUrl && selected !== null && (
            <button
              onClick={() => new Audio(q.word.audioUrl!).play()}
              className="mt-4 flex items-center gap-2 text-zinc-500 hover:text-violet-400 text-sm transition-colors"
            >
              <Volume2 size={14} />
              Hear pronunciation
            </button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 mb-6">
        {q.options.map((option) => {
          const isSelected = selected === option;
          const isCorrect = option === q.correctAnswer;
          let style =
            "bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600";

          if (selected !== null) {
            if (isCorrect) {
              style = "bg-emerald-600/15 border-emerald-500/40 text-emerald-300";
            } else if (isSelected && !isCorrect) {
              style = "bg-red-600/15 border-red-500/40 text-red-300";
            } else {
              style = "bg-zinc-900 border-zinc-800 text-zinc-500";
            }
          }

          return (
            <button
              key={option}
              onClick={() => handleAnswer(option)}
              disabled={selected !== null}
              className={`w-full text-left px-5 py-4 rounded-xl border transition-all flex items-center justify-between ${style}`}
            >
              <span className="font-medium">{option}</span>
              {selected !== null && isCorrect && (
                <CheckCircle size={18} className="text-emerald-400 shrink-0" />
              )}
              {selected !== null && isSelected && !isCorrect && (
                <XCircle size={18} className="text-red-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="space-y-3">
          {selected !== q.correctAnswer && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-violet-600/20 text-violet-300 border-violet-600/30 text-xs">
                  {q.word.meanings[0]?.partOfSpeech}
                </Badge>
              </div>
              <p className="text-zinc-300 text-sm">{q.word.meanings[0]?.definitions[0]?.definition}</p>
              {q.word.meanings[0]?.definitions[0]?.example && (
                <p className="text-zinc-500 text-xs mt-1 italic">
                  &ldquo;{q.word.meanings[0].definitions[0].example}&rdquo;
                </p>
              )}
            </div>
          )}
          <Button
            onClick={handleNext}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white"
          >
            {current + 1 >= questions.length ? "See Results" : "Next Question"}
          </Button>
        </div>
      )}
    </div>
  );
}
