import { wordsInBook, wordById } from '../data/words';
import { DAILY_CHOICES, type Activity, type BookDay, type Card, type Rating, type State } from '../types';
import { applyRating, dayKey, emptyCard, isBookGoalMet, isDue } from './srs';

export type Action =
  | { type: 'tick'; now: number }
  | { type: 'rate'; wordId: string; rating: Rating; kind: 'new' | 'review'; firstPass: boolean; now: number }
  | { type: 'set-book'; bookId: string }
  | { type: 'set-daily'; dailyNew: number; now: number }
  | { type: 'set-nickname'; nickname: string }
  | { type: 'toggle-speak' }
  | { type: 'toggle-notebook'; wordId: string; now: number }
  | { type: 'reset'; now: number };

export function freshState(now = Date.now()): State {
  return {
    settings: { bookId: 'cet4', dailyNew: 10, autoSpeak: true, nickname: '同学' },
    cards: {},
    today: { date: dayKey(new Date(now)), books: {} },
    activity: {},
  };
}

function dueCount(cards: State['cards'], bookId: string, now: number): number {
  return wordsInBook(bookId).filter((word) => isDue(cards[word.id], now)).length;
}

function remainingNew(cards: State['cards'], bookId: string): number {
  return wordsInBook(bookId).filter((word) => !cards[word.id]?.introduced).length;
}

export function ensureToday(state: State, now: number): State {
  const date = dayKey(new Date(now));
  if (state.today.date === date) return state;
  return { ...state, today: { date, books: {} } };
}

function withActivity(state: State, rating?: Rating): State {
  const date = state.today.date;
  const prev = state.activity[date];
  const books = Object.values(state.today.books);
  const next: Activity = {
    newCount: books.reduce((sum, book) => sum + book.newCount, 0),
    reviewCount: books.reduce((sum, book) => sum + book.reviewCount, 0),
    checkedIn: books.some((book) => book.checkedIn),
    again: prev?.again ?? 0,
    hard: prev?.hard ?? 0,
    good: prev?.good ?? 0,
    easy: prev?.easy ?? 0,
  };
  if (rating) next[rating] += 1;
  return { ...state, activity: { ...state.activity, [date]: next } };
}

function recomputeGoals(state: State): State {
  let changed = false;
  const books = { ...state.today.books };
  for (const [bookId, log] of Object.entries(books)) {
    const met = isBookGoalMet(log, state.settings.dailyNew, remainingNew(state.cards, bookId));
    if (met !== log.checkedIn) {
      books[bookId] = { ...log, checkedIn: met };
      changed = true;
    }
  }
  if (!changed) return state;
  return withActivity({ ...state, today: { ...state.today, books } });
}

function ensureBook(state: State, bookId: string, now: number): State {
  const base = ensureToday(state, now);
  if (base.today.books[bookId]) return base;
  const log: BookDay = {
    newCount: 0,
    reviewCount: 0,
    reviewTarget: dueCount(base.cards, bookId, now),
    checkedIn: false,
  };
  return { ...base, today: { ...base.today, books: { ...base.today.books, [bookId]: log } } };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'tick': {
      const next = ensureToday(state, action.now);
      return next === state ? state : next;
    }
    case 'set-book': {
      if (!['cet4', 'cet6', 'kaoyan', 'ielts'].includes(action.bookId)) return state;
      if (state.settings.bookId === action.bookId) return state;
      return { ...state, settings: { ...state.settings, bookId: action.bookId } };
    }
    case 'set-daily': {
      if (!DAILY_CHOICES.includes(action.dailyNew as (typeof DAILY_CHOICES)[number])) return state;
      const next = ensureToday(
        { ...state, settings: { ...state.settings, dailyNew: action.dailyNew } },
        action.now,
      );
      return recomputeGoals(next);
    }
    case 'set-nickname': {
      const nickname = action.nickname.trim().slice(0, 12) || '同学';
      if (nickname === state.settings.nickname) return state;
      return { ...state, settings: { ...state.settings, nickname } };
    }
    case 'toggle-speak':
      return { ...state, settings: { ...state.settings, autoSpeak: !state.settings.autoSpeak } };
    case 'toggle-notebook': {
      if (!wordById[action.wordId]) return state;
      const prev = state.cards[action.wordId] ?? emptyCard();
      const card: Card = { ...prev, notebook: !prev.notebook, updatedAt: action.now };
      return { ...state, cards: { ...state.cards, [action.wordId]: card } };
    }
    case 'reset':
      return freshState(action.now);
    case 'rate': {
      if (!wordById[action.wordId]) return state;
      const word = wordById[action.wordId];
      let next = ensureBook(state, word.bookId, action.now);
      const prev = next.cards[word.id] ?? emptyCard();
      const card = applyRating(prev, action.rating, action.now);
      const log = next.today.books[word.bookId];
      const updated: BookDay = {
        ...log,
        newCount: log.newCount + (action.firstPass && action.kind === 'new' ? 1 : 0),
        reviewCount: log.reviewCount + (action.firstPass && action.kind === 'review' ? 1 : 0),
        checkedIn: false,
      };
      updated.checkedIn = isBookGoalMet(updated, next.settings.dailyNew, remainingNew({ ...next.cards, [word.id]: card }, word.bookId));
      next = {
        ...next,
        cards: { ...next.cards, [word.id]: card },
        today: { ...next.today, books: { ...next.today.books, [word.bookId]: updated } },
      };
      return withActivity(next, action.rating);
    }
    default:
      return state;
  }
}
