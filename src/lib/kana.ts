export function toHiragana(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, '')
    .normalize('NFKC')
    .replace(/[\u30a1-\u30f6]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}

export function matchesReading(guess: string, word: string, reading: string): boolean {
  const normalized = toHiragana(guess);
  if (!normalized) return false;
  return normalized === toHiragana(reading) || normalized === toHiragana(word);
}
