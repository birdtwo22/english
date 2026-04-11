import { SavedWord } from "@/types";
import { supabase } from "./supabase";

type Row = {
  id: string;
  word: string;
  phonetic: string | null;
  audio_url: string | null;
  meanings: SavedWord["meanings"];
  saved_at: string;
  mastery_level: number;
  quiz_count: number;
  correct_count: number;
  last_quizzed_at: string | null;
  korean_translation: string | null;
};

function rowToWord(row: Row): SavedWord {
  return {
    id: row.id,
    word: row.word,
    phonetic: row.phonetic ?? undefined,
    audioUrl: row.audio_url ?? undefined,
    meanings: row.meanings,
    savedAt: row.saved_at,
    masteryLevel: row.mastery_level,
    quizCount: row.quiz_count,
    correctCount: row.correct_count,
    lastQuizzedAt: row.last_quizzed_at ?? undefined,
    koreanTranslation: row.korean_translation ?? undefined,
  };
}

export async function getWords(): Promise<SavedWord[]> {
  const { data, error } = await supabase
    .from("saved_words")
    .select("*")
    .order("saved_at", { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(rowToWord);
}

export async function saveWord(word: SavedWord): Promise<void> {
  const { error } = await supabase.from("saved_words").upsert({
    id: word.id,
    word: word.word,
    phonetic: word.phonetic ?? null,
    audio_url: word.audioUrl ?? null,
    meanings: word.meanings,
    saved_at: word.savedAt,
    mastery_level: word.masteryLevel,
    quiz_count: word.quizCount,
    correct_count: word.correctCount,
    last_quizzed_at: word.lastQuizzedAt ?? null,
    korean_translation: word.koreanTranslation ?? null,
  });
  if (error) throw error;
}

export async function deleteWord(id: string): Promise<void> {
  const { error } = await supabase.from("saved_words").delete().eq("id", id);
  if (error) throw error;
}

export async function updateWordStats(
  id: string,
  correct: boolean
): Promise<SavedWord | null> {
  const { data: rows, error: fetchError } = await supabase
    .from("saved_words")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchError || !rows) return null;

  const row = rows as Row;
  const quizCount = row.quiz_count + 1;
  const correctCount = row.correct_count + (correct ? 1 : 0);
  const masteryLevel = Math.round((correctCount / quizCount) * 100);
  const lastQuizzedAt = new Date().toISOString();

  const { error } = await supabase
    .from("saved_words")
    .update({ quiz_count: quizCount, correct_count: correctCount, mastery_level: masteryLevel, last_quizzed_at: lastQuizzedAt })
    .eq("id", id);
  if (error) throw error;

  return rowToWord({ ...row, quiz_count: quizCount, correct_count: correctCount, mastery_level: masteryLevel, last_quizzed_at: lastQuizzedAt });
}

export async function isWordSaved(wordText: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("saved_words")
    .select("id")
    .ilike("word", wordText)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

export async function getStats() {
  const words = await getWords();
  const total = words.length;
  const quizzed = words.filter((w) => w.quizCount > 0);
  const mastered = words.filter((w) => w.masteryLevel >= 80).length;
  const needsReview = words.filter(
    (w) => w.quizCount > 0 && w.masteryLevel < 50
  ).length;

  const weakWords = [...words]
    .filter((w) => w.quizCount > 0)
    .sort((a, b) => a.masteryLevel - b.masteryLevel)
    .slice(0, 8);

  const avgMastery =
    quizzed.length > 0
      ? Math.round(
          quizzed.reduce((sum, w) => sum + w.masteryLevel, 0) / quizzed.length
        )
      : 0;

  return { total, mastered, needsReview, weakWords, avgMastery };
}
