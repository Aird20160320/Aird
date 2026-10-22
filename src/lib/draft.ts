import { toHiragana } from './kana';

export const POS_CHOICES = ['名', '动', 'い形', 'な形', '代', '副', '其他'] as const;

export const COVER_PALETTE = [
  { tint: '#7a4e9a', ink: '#f7eefe' },
  { tint: '#b23a48', ink: '#fff1f3' },
  { tint: '#245e86', ink: '#e8f4fb' },
  { tint: '#8a5a2b', ink: '#fbf4ea' },
  { tint: '#3d6b4f', ink: '#e8f6ee' },
] as const;

const HIRAGANA = /^[\u3040-\u309f]+$/;

export function customBookId(now: number, index: number): string {
  return `cb-${now.toString(36)}-${index.toString(36)}`;
}

export function customWordId(now: number, index: number): string {
  return `cw-${now.toString(36)}-${index.toString(36)}`;
}

export function bookNameError(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return '先写词书名称';
  if (trimmed.length > 16) return '名称请控制在 16 个字以内';
  return null;
}

export function cleanBookName(name: string): string | null {
  if (bookNameError(name)) return null;
  return name.trim().replace(/\s+/g, ' ');
}

export function cleanBlurb(blurb: string): string {
  return blurb.trim().replace(/\s+/g, ' ').slice(0, 40);
}

export type BuiltWord = {
  word: string;
  reading: string;
  pos: string;
  def: string;
  exampleJp: string;
  exampleZh: string;
  tip: string;
};

export function wordDraftError(input: {
  word: string;
  reading: string;
  def: string;
}): string | null {
  const word = input.word.trim().replace(/\s+/g, '');
  if (!word) return '先写日语单词';
  if (word.length > 24) return '单词最长 24 个字';
  if (!input.reading.trim()) return '先写读音';
  const reading = toHiragana(input.reading);
  if (!HIRAGANA.test(reading)) return '读音请用平假名或片假名';
  if (reading.length > 32) return '读音太长了';
  const def = input.def.trim();
  if (!def) return '先写中文释义';
  if (def.length > 48) return '释义最长 48 个字';
  return null;
}

export function buildCustomWord(input: {
  word: string;
  reading: string;
  pos: string;
  def: string;
  exampleJp?: string;
  exampleZh?: string;
  tip?: string;
}): BuiltWord | null {
  if (wordDraftError(input)) return null;
  const pos = (POS_CHOICES as readonly string[]).includes(input.pos) ? input.pos : '名';
  return {
    word: input.word.trim().replace(/\s+/g, ''),
    reading: toHiragana(input.reading),
    pos,
    def: input.def.trim().replace(/\s+/g, ' '),
    exampleJp: (input.exampleJp ?? '').trim().slice(0, 80),
    exampleZh: (input.exampleZh ?? '').trim().slice(0, 80),
    tip: (input.tip ?? '').trim().replace(/\s+/g, ' ').slice(0, 80),
  };
}
