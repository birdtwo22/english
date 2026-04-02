"use client";

import { useEffect, useState, useCallback } from "react";
import { getWords, updateWordStats } from "@/lib/storage";
import { SavedWord } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle, XCircle, RotateCcw, Square, Volume2 } from "lucide-react";
import Link from "next/link";

interface Question {
  word: SavedWord;
  sentence: string;      // example with ___ in place of the word
  options: string[];
  correctAnswer: string;
  hasExample: boolean;   // false = fell back to definition hint
}

function buildSentence(word: SavedWord): { sentence: string; hasExample: boolean } {
  // Try to find an example sentence containing the word
  for (const meaning of word.meanings) {
    for (const def of meaning.definitions) {
      if (!def.example) continue;
      const regex = new RegExp(`\\b${word.word}\\b`, "i");
      if (regex.test(def.example)) {
        const blanked = def.example.replace(regex, "___");
        return { sentence: blanked, hasExample: true };
      }
    }
  }
  // Fallback: show definition as hint
  const def = word.meanings[0]?.definitions[0]?.definition ?? "";
  return { sentence: def, hasExample: false };
}

function buildQuestion(word: SavedWord, allWords: SavedWord[]): Question {
  const { sentence, hasExample } = buildSentence(word);
  const distractors = allWords
    .filter((w) => w.id !== word.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((w) => w.word);
  const options = [...distractors, word.word].sort(() => Math.random() - 0.5);
  return { word, sentence, options, correctAnswer: word.word, hasExample };
}

export default function QuizPage() {
  const [allWords, setAllWords] = useState<SavedWord[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  const nextQuestion = useCallback((words: SavedWord[]) => {
    if (words.length < 2) return;
    const word = words[Math.floor(Math.random() * words.length)];
    setQuestion(buildQuestion(word, words));
    setSelected(null);
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

  function handleNext() {
    nextQuestion(allWords);
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

  if (!question) return null;

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
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardContent className="p-8">
          {question.hasExample ? (
            <>
              <p className="text-zinc-400 text-sm mb-3">빈칸에 들어갈 단어는?</p>
              <p className="text-xl text-zinc-100 leading-relaxed font-medium">
                {question.sentence.split("___").map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className={`inline-block min-w-[80px] border-b-2 text-center mx-1 ${
                        selected === null ? "border-violet-500" :
                        selected === question.correctAnswer ? "border-emerald-500 text-emerald-400" :
                        "border-red-500 text-red-400"
                      }`}>
                        {selected !== null ? question.correctAnswer : "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </>
          ) : (
            <>
              <p className="text-zinc-400 text-sm mb-3">이 뜻에 맞는 단어는?</p>
              <p className="text-xl text-zinc-100 leading-relaxed font-medium">
                &ldquo;{question.sentence}&rdquo;
              </p>
            </>
          )}
          {question.word.audioUrl && selected !== null && (
            <button
              onClick={() => new Audio(question.word.audioUrl!).play()}
              className="mt-4 flex items-center gap-2 text-zinc-500 hover:text-violet-400 text-sm transition-colors"
            >
              <Volume2 size={14} />
              발음 듣기
            </button>
          )}
        </CardContent>
      </Card>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {question.options.map((option) => {
          const isSelected = selected === option;
          const isCorrect = option === question.correctAnswer;
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
              disabled={selected !== null}
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
      {selected !== null && (
        <div className="space-y-3">
          {selected !== question.correctAnswer && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <Badge className="mb-2 bg-violet-600/20 text-violet-300 border-violet-600/30 text-xs">
                {question.word.meanings[0]?.partOfSpeech}
              </Badge>
              <p className="text-zinc-300 text-sm">{question.word.meanings[0]?.definitions[0]?.definition}</p>
              {question.word.meanings[0]?.definitions[0]?.example && (
                <p className="text-zinc-500 text-xs mt-1 italic">
                  &ldquo;{question.word.meanings[0].definitions[0].example}&rdquo;
                </p>
              )}
            </div>
          )}
          <Button onClick={handleNext} className="w-full bg-violet-600 hover:bg-violet-500 text-white">
            다음 문제
          </Button>
        </div>
      )}
    </div>
  );
}
