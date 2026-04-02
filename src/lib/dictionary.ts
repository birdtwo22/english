import { DictionaryEntry } from "@/types";

export async function lookupWord(word: string): Promise<DictionaryEntry[]> {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.trim())}`
  );
  if (!res.ok) {
    if (res.status === 404) throw new Error("Word not found");
    throw new Error("Failed to fetch word");
  }
  return res.json();
}

export function getAudioUrl(entries: DictionaryEntry[]): string | undefined {
  for (const entry of entries) {
    for (const phonetic of entry.phonetics) {
      if (phonetic.audio) return phonetic.audio;
    }
  }
}

export function getPhoneticText(entries: DictionaryEntry[]): string | undefined {
  for (const entry of entries) {
    for (const phonetic of entry.phonetics) {
      if (phonetic.text) return phonetic.text;
    }
  }
}
