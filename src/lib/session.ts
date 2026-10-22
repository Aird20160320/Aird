import type { State, Word } from '../types';
import { wordsForBook } from './catalog';
import { dayKey, isDue } from './srs';

export type SessionItem = {
  word: Word;
  kind: 'new' | 'review';
  passes: number;
};

const REVIEW_CAP = 30;

export function buildSession(state: State, now: number, extra: boolean): SessionItem[] {
  const bookId = state.settings.bookId;
  const list = wordsForBook(state, bookId);
  const freshToday = state.today.date === dayKey(new Date(now));
  const log = freshToday ? state.today.books[bookId] : undefined;

  if (extra) {
    return list
      .filter((word) => !state.cards[word.id]?.introduced)
      .slice(0, 5)
      .map((word) => ({ word, kind: 'new', passes: 0 }));
  }

  const reviews = list
    .filter((word) => isDue(state.cards[word.id], now))
    .sort((a, b) => (state.cards[a.id]?.due ?? 0) - (state.cards[b.id]?.due ?? 0))
    .slice(0, REVIEW_CAP)
    .map((word) => ({ word, kind: 'review' as const, passes: 0 }));

  const quota = Math.max(0, state.settings.dailyNew - (log?.newCount ?? 0));
  const news = list
    .filter((word) => !state.cards[word.id]?.introduced)
    .slice(0, quota)
    .map((word) => ({ word, kind: 'new' as const, passes: 0 }));

  return [...reviews, ...news];
}

export function nextQueue(queue: SessionItem[], rating: 'again' | 'hard' | 'good' | 'easy'): SessionItem[] {
  if (queue.length === 0) return [];
  const [item, ...rest] = queue;
  if (rating === 'again' && item.passes < 2) {
    const back = { ...item, passes: item.passes + 1 };
    const at = Math.min(2, rest.length);
    return [...rest.slice(0, at), back, ...rest.slice(at)];
  }
  return rest;
}
