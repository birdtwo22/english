export interface Phonetic {
  text?: string;
  audio?: string;
}

export interface Definition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
  synonyms?: string[];
  antonyms?: string[];
}

export interface DictionaryEntry {
  word: string;
  phonetics: Phonetic[];
  meanings: Meaning[];
}

export interface SavedWord {
  id: string;
  word: string;
  phonetic?: string;
  audioUrl?: string;
  meanings: Meaning[];
  savedAt: string;
  masteryLevel: number; // 0-100
  quizCount: number;
  correctCount: number;
  lastQuizzedAt?: string;
}

export interface QuizQuestion {
  word: SavedWord;
  correctAnswer: string;
  options: string[];
  questionType: "definition" | "word";
}
