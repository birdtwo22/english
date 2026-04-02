export function isKorean(text: string): boolean {
  return /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/.test(text);
}

export async function translateToKorean(text: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ko`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.responseData?.translatedText ?? null;
  } catch {
    return null;
  }
}

export async function translateToEnglish(text: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|en`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const translated = data?.responseData?.translatedText ?? null;
    // Return only the first word (dictionary lookup needs a single word)
    return translated ? translated.split(/\s+/)[0].toLowerCase() : null;
  } catch {
    return null;
  }
}
