import { wordById } from '../data/words';
import { DAILY_CHOICES, type Activity, type BookDay, type Card, type State } from '../types';
import { freshState } from './reducer';
import { clampStage, dayKey } from './srs';

const KEY = 'shanbei-words-v1';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function num(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function sanitize(input: unknown, now = Date.now()): State {
  const base = freshState(now);
  if (!input || typeof input !== 'object') return base;
  const raw = input as Partial<State>;
  const settings = raw.settings;
  const bookId = settings && ['cet4', 'cet6', 'kaoyan', 'ielts'].includes(settings.bookId) ? settings.bookId : base.settings.bookId;
  const dailyNew = settings && DAILY_CHOICES.includes(settings.dailyNew as (typeof DAILY_CHOICES)[number]) ? settings.dailyNew : 10;
  const nickname = settings && typeof settings.nickname === 'string' && settings.nickname.trim() ? settings.nickname.trim().slice(0, 12) : '同学';
  const autoSpeak = settings?.autoSpeak !== false;

  const cards: Record<string, Card> = {};
  if (raw.cards && typeof raw.cards === 'object') {
    for (const [id, card] of Object.entries(raw.cards)) {
      if (!wordById[id] || !card || typeof card !== 'object') continue;
      const current = card as Partial<Card>;
      const introduced = !!current.introduced;
      cards[id] = {
        introduced,
        stage: introduced ? clampStage(num(current.stage)) : 0,
        due: num(current.due),
        notebook: !!current.notebook,
        lapses: num(current.lapses),
        reviews: num(current.reviews),
        correct: num(current.correct),
        updatedAt: num(current.updatedAt),
      };
    }
  }

  const today = raw.today && typeof raw.today === 'object' && DATE_RE.test(raw.today.date) ? raw.today : { date: dayKey(new Date(now)), books: {} };
  const books: Record<string, BookDay> = {};
  if (today.books && typeof today.books === 'object') {
    for (const [id, log] of Object.entries(today.books)) {
      if (!['cet4', 'cet6', 'kaoyan', 'ielts'].includes(id) || !log || typeof log !== 'object') continue;
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
