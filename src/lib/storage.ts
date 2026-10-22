import { isBookId, wordById } from '../data/words';
import { DAILY_CHOICES, type Activity, type Book, type BookDay, type Card, type State, type Word } from '../types';
import { COVER_PALETTE, buildCustomWord } from './draft';
import { reviewedAtOf } from './memory';
import { freshState } from './reducer';
import { clampStage, dayKey } from './srs';

const KEY = 'shanbei-jp-v1';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function sanitizeCustomBooks(input: unknown): Book[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const list: Book[] = [];
  for (const item of input) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Partial<Book>;
    if (typeof raw.id !== 'string' || !/^cb-[a-z0-9-]+$/.test(raw.id) || seen.has(raw.id)) continue;
    if (typeof raw.name !== 'string') continue;
    const name = raw.name.trim().replace(/\s+/g, ' ').slice(0, 16);
    if (!name) continue;
    const palette = COVER_PALETTE[list.length % COVER_PALETTE.length];
    const tint = typeof raw.tint === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.tint) ? raw.tint : palette.tint;
    const ink = typeof raw.ink === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.ink) ? raw.ink : palette.ink;
    seen.add(raw.id);
    list.push({
      id: raw.id,
      name,
      level: '自建',
      blurb: typeof raw.blurb === 'string' ? raw.blurb.trim().replace(/\s+/g, ' ').slice(0, 40) : '',
      tint,
      ink,
      custom: true,
    });
  }
  return list;
}

function sanitizeCustomWords(input: unknown, bookIds: Set<string>): Word[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const list: Word[] = [];
  for (const item of input) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as Partial<Word>;
    if (typeof raw.id !== 'string' || !/^cw-[a-z0-9-]+$/.test(raw.id) || seen.has(raw.id)) continue;
    if (typeof raw.bookId !== 'string' || !bookIds.has(raw.bookId)) continue;
    const sense = Array.isArray(raw.senses) ? raw.senses[0] : undefined;
    const example = Array.isArray(raw.examples) ? raw.examples[0] : undefined;
    const built = buildCustomWord({
      word: typeof raw.word === 'string' ? raw.word : '',
      reading: typeof raw.reading === 'string' ? raw.reading : '',
      pos: sense && typeof sense === 'object' && typeof sense.pos === 'string' ? sense.pos : '名',
      def: sense && typeof sense === 'object' && typeof sense.def === 'string' ? sense.def : '',
      exampleJp: example && typeof example === 'object' && typeof example.jp === 'string' ? example.jp : '',
      exampleZh: example && typeof example === 'object' && typeof example.zh === 'string' ? example.zh : '',
      tip: typeof raw.tip === 'string' ? raw.tip : '',
    });
    if (!built) continue;
    seen.add(raw.id);
    list.push({
      id: raw.id,
      bookId: raw.bookId,
      word: built.word,
      reading: built.reading,
      tip: built.tip,
      senses: [{ pos: built.pos, def: built.def }],
      examples: built.exampleJp || built.exampleZh ? [{ jp: built.exampleJp, zh: built.exampleZh }] : [],
      synonyms: [],
    });
  }
  return list;
}

export function sanitize(input: unknown, now = Date.now()): State {
  const base = freshState(now);
  if (!input || typeof input !== 'object') return base;
  const raw = input as Partial<State>;
  const customBooks = sanitizeCustomBooks(raw.customBooks);
  const customBookIds = new Set(customBooks.map((book) => book.id));
  const customWords = sanitizeCustomWords(raw.customWords, customBookIds);
  const customWordIds = new Set(customWords.map((word) => word.id));
  const settings = raw.settings;
  const requestedBook = settings && typeof settings.bookId === 'string' ? settings.bookId : '';
  const bookId = isBookId(requestedBook) || customBookIds.has(requestedBook) ? requestedBook : base.settings.bookId;
  const dailyNew = settings && DAILY_CHOICES.includes(settings.dailyNew as (typeof DAILY_CHOICES)[number]) ? settings.dailyNew : 10;
  const nickname = settings && typeof settings.nickname === 'string' && settings.nickname.trim() ? settings.nickname.trim().slice(0, 12) : '同学';
  const autoSpeak = settings?.autoSpeak !== false;

  const cards: Record<string, Card> = {};
  if (raw.cards && typeof raw.cards === 'object') {
    for (const [id, card] of Object.entries(raw.cards)) {
      if ((!wordById[id] && !customWordIds.has(id)) || !card || typeof card !== 'object') continue;
      const current = card as Partial<Card>;
      const introduced = !!current.introduced;
      const stage = introduced ? clampStage(num(current.stage)) : 0;
      const due = num(current.due);
      const updatedAt = num(current.updatedAt);
      cards[id] = {
        introduced,
        stage,
        due,
        notebook: !!current.notebook,
        lapses: num(current.lapses),
        reviews: num(current.reviews),
        correct: num(current.correct),
        updatedAt,
        reviewedAt: introduced
          ? reviewedAtOf({
              introduced,
              stage,
              due,
              notebook: false,
              lapses: 0,
              reviews: 0,
              correct: 0,
              updatedAt,
              reviewedAt: num(current.reviewedAt),
            })
          : 0,
      };
    }
  }

  const today = raw.today && typeof raw.today === 'object' && DATE_RE.test(raw.today.date) ? raw.today : { date: dayKey(new Date(now)), books: {} };
  const books: Record<string, BookDay> = {};
  if (today.books && typeof today.books === 'object') {
    for (const [id, log] of Object.entries(today.books)) {
      if ((!isBookId(id) && !customBookIds.has(id)) || !log || typeof log !== 'object') continue;
      const current = log as Partial<BookDay>;
      books[id] = {
        newCount: num(current.newCount),
        reviewCount: num(current.reviewCount),
        reviewTarget: num(current.reviewTarget),
        checkedIn: !!current.checkedIn,
      };
    }
  }

  const activity: Record<string, Activity> = {};
  if (raw.activity && typeof raw.activity === 'object') {
    for (const [date, item] of Object.entries(raw.activity)) {
      if (!DATE_RE.test(date) || !item || typeof item !== 'object') continue;
      const current = item as Partial<Activity>;
      activity[date] = {
        newCount: num(current.newCount),
        reviewCount: num(current.reviewCount),
        checkedIn: !!current.checkedIn,
        again: num(current.again),
        hard: num(current.hard),
        good: num(current.good),
        easy: num(current.easy),
      };
    }
  }

  return {
    settings: { bookId, dailyNew, autoSpeak, nickname },
    cards,
    today: { date: today.date, books },
    activity,
    customBooks,
    customWords,
  };
}

export function loadState(): State {
  if (typeof localStorage === 'undefined') return freshState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as { version?: number; state?: unknown };
    if (parsed.version !== 1) return freshState();
    return sanitize(parsed.state);
  } catch {
    return freshState();
  }
}

export function saveState(state: State): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify({ version: 1, state }));
}
