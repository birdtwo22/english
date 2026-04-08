"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { saveWord, isWordSaved } from "@/lib/storage";
import { SavedWord, Meaning } from "@/types";
import { BookmarkCheck, BookmarkPlus, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

type Status = "loading" | "ready" | "saving" | "saved" | "already" | "error";

function ClaudePageInner() {
  const params = useSearchParams();
  const router = useRouter();

  const word      = params.get("word") ?? "";
  const pos       = params.get("pos") ?? "unknown";
  const meaning   = params.get("meaning") ?? "";
  const korean    = params.get("korean") ?? "";
  const example1  = params.get("ex1") ?? "";
  const example2  = params.get("ex2") ?? "";
  const tip       = params.get("tip") ?? "";
  const synsRaw   = params.get("synonyms") ?? "";
  const synonyms  = synsRaw ? synsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const [status, setStatus] = useState<Status>("loading");

  const checkAndSave = useCallback(async (autoSave: boolean) => {
    if (!word) { setStatus("error"); return; }
    const already = await isWordSaved(word);
    if (already) { setStatus("already"); return; }
    if (autoSave) {
      await doSave();
    } else {
      setStatus("ready");
    }
  }, [word]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    checkAndSave(false);
  }, [checkAndSave]);

  async function doSave() {
    setStatus("saving");
    try {
      const definitions = [];
      if (meaning) {
        definitions.push({
          definition: meaning,
          example: example1 || undefined,
          synonyms,
          koreanDefinition: korean || undefined,
        });
      }
      if (example2) {
        definitions.push({ definition: meaning, example: example2 });
      }

      const meanings: Meaning[] = [{
        partOfSpeech: pos,
        definitions,
        synonyms,
      }];

      const saved: SavedWord = {
        id: crypto.randomUUID(),
        word: word.toLowerCase().trim(),
        meanings,
        savedAt: new Date().toISOString(),
        masteryLevel: 0,
        quizCount: 0,
        correctCount: 0,
        koreanTranslation: korean || undefined,
      };

      await saveWord(saved);
      setStatus("saved");
      setTimeout(() => router.push("/vocabulary"), 2000);
    } catch {
      setStatus("error");
    }
  }

  if (!word) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center mt-20">
        <p className="text-zinc-400">단어 정보가 없어요.</p>
        <Link href="/search">
          <Button variant="outline" className="mt-4">검색하러 가기</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/vocabulary">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-violet-400" />
          <span className="text-zinc-400 text-sm">Claude가 알려준 단어</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-3 mb-2">
          <h1 className="text-4xl font-bold text-zinc-100">{word}</h1>
          <Badge className="bg-violet-600/20 text-violet-300 border-violet-600/30">{pos}</Badge>
        </div>
        {korean && <p className="text-lg text-violet-300 font-medium mt-1">{korean}</p>}
      </div>

      {meaning && (
        <Card className="bg-zinc-900 border-zinc-800 mb-4">
          <CardContent className="p-5">
            <p className="text-zinc-200 text-sm leading-relaxed">{meaning}</p>
            {synonyms.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {synonyms.map((s) => (
                  <span key={s} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md">{s}</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(example1 || example2) && (
        <Card className="bg-zinc-900 border-zinc-800 mb-4">
          <CardContent className="p-5 space-y-3">
            {[example1, example2].filter(Boolean).map((ex, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="mt-1 w-5 h-5 rounded-full bg-amber-600/20 text-amber-400 text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                <p className="text-zinc-300 text-sm italic leading-relaxed">&ldquo;{ex}&rdquo;</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {tip && (
        <Card className="bg-violet-600/10 border-violet-600/20 mb-6">
          <CardContent className="p-4">
            <p className="text-violet-300 text-sm leading-relaxed">💡 {tip}</p>
          </CardContent>
        </Card>
      )}

      <div className="mt-2">
        {status === "loading" && (
          <Button disabled className="w-full bg-zinc-800 text-zinc-400">
            <Loader2 size={16} className="mr-2 animate-spin" /> 확인 중...
          </Button>
        )}
        {status === "ready" && (
          <Button onClick={doSave} className="w-full bg-violet-600 hover:bg-violet-500 text-white">
            <BookmarkPlus size={16} className="mr-2" /> Lexie에 저장하기
          </Button>
        )}
        {status === "saving" && (
          <Button disabled className="w-full bg-violet-600 text-white opacity-70">
            <Loader2 size={16} className="mr-2 animate-spin" /> 저장 중...
          </Button>
        )}
        {status === "saved" && (
          <Button disabled className="w-full bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
            <BookmarkCheck size={16} className="mr-2" /> 저장 완료! 단어장으로 이동 중...
          </Button>
        )}
        {status === "already" && (
          <div className="text-center space-y-3">
            <p className="text-zinc-400 text-sm">이미 단어장에 있는 단어예요 ✓</p>
            <Link href="/vocabulary">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">단어장 보기</Button>
            </Link>
          </div>
        )}
        {status === "error" && (
          <p className="text-red-400 text-sm text-center">저장 중 오류가 발생했어요. 다시 시도해주세요.</p>
        )}
      </div>
    </div>
  );
}

export default function ClaudePage() {
  return (
    <Suspense fallback={
      <div className="p-8 max-w-xl mx-auto flex items-center justify-center mt-20">
        <Loader2 size={20} className="animate-spin text-zinc-500" />
      </div>
    }>
      <ClaudePageInner />
    </Suspense>
  );
}
