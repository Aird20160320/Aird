export function splitHighlight(sentence: string, word: string): { text: string; hit: boolean }[] {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b(${escaped}(?:s|es|ed|ing|d)?)\\b`, 'gi');
  const parts: { text: string; hit: boolean }[] = [];
  let last = 0;
  for (const match of sentence.matchAll(re)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: sentence.slice(last, index), hit: false });
    parts.push({ text: match[0], hit: true });
    last = index + match[0].length;
  }
  if (last < sentence.length) parts.push({ text: sentence.slice(last), hit: false });
  if (parts.length === 0) parts.push({ text: sentence, hit: false });
  return parts;
}
