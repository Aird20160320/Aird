export function splitHighlight(sentence: string, word: string): { text: string; hit: boolean }[] {
  if (!word) return [{ text: sentence, hit: false }];
  if (/[A-Za-z0-9]/.test(word)) return splitAscii(sentence, word);
  return splitLiteral(sentence, word);
}

function splitLiteral(sentence: string, word: string): { text: string; hit: boolean }[] {
  const parts: { text: string; hit: boolean }[] = [];
  let last = 0;
  let index = sentence.indexOf(word);
  if (index < 0) return [{ text: sentence, hit: false }];
  while (index >= 0) {
    if (index > last) parts.push({ text: sentence.slice(last, index), hit: false });
    parts.push({ text: word, hit: true });
    last = index + word.length;
    index = sentence.indexOf(word, last);
  }
  if (last < sentence.length) parts.push({ text: sentence.slice(last), hit: false });
  return parts;
}

function splitAscii(sentence: string, word: string): { text: string; hit: boolean }[] {
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
