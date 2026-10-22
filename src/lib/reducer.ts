import { wordById } from '../data/words';
import { DAILY_CHOICES, type Activity, type Book, type BookDay, type Card, type Rating, type State, type Word } from '../types';
import { findWord, isCustomBook, isKnownBook, wordsForBook } from './catalog';
import { COVER_PALETTE, buildCustomWord, cleanBlurb, cleanBookName, customBookId, customWordId } from './draft';
import { applyRating, dayKey, emptyCard, isBookGoalMet, isDue } from './srs';

export type Action =
  | { type: 'tick'; now: number }
  | { type: 'rate'; wordId: string; rating: Rating; kind: 'new' | 'review'; firstPass: boolean; now: number }
  | { type: 'set-book'; bookId: string }
  | { type: 'set-daily'; dailyNew: number; now: number }
  | { type: 'set-nickname'; nickname: string }
  | { type: 'toggle-speak' }
  | { type: 'toggle-notebook'; wordId: string; now: number }
  | { type: 'create-book'; name: string; blurb?: string; now: number }
  | { type: 'delete-book'; bookId: string }
  | {
      type: 'add-word';
      bookId: string;
      word: string;
      reading: string;
      pos: string;
      def: string;
      exampleJp?: string;
      exampleZh?: string;
      tip?: string;
      now: number;
    }
  | { type: 'delete-word'; wordId: string }
  | { type: 'reset'; now: number };

export function freshState(now = Date.now()): State {
  return {
    settings: { bookId: 'n5', dailyNew: 10, autoSpeak: true, nickname: '同学' },
    cards: {},
    today: { date: dayKey(new Date(now)), books: {} },
    activity: {},
    customBooks: [],
    customWords: [],
  };
}

function dueCount(state: State, bookId: string, now: number): number {
  return wordsForBook(state, bookId).filter((word) => isDue(state.cards[word.id], now)).length;
}

function remainingNew(state: State, bookId: string): number {
  return wordsForBook(state, bookId).filter((word) => !state.cards[word.id]?.introduced).length;
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
    const met = isBookGoalMet(log, state.settings.dailyNew, remainingNew(state, bookId));
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
    reviewTarget: dueCount(base, bookId, now),
    checkedIn: false,
  };
  return { ...base, today: { ...base.today, books: { ...base.today.books, [bookId]: log } } };
}

function toStoredWord(bookId: string, id: string, built: NonNullable<ReturnType<typeof buildCustomWord>>): Word {
  return {
    id,
    bookId,
    word: built.word,
    reading: built.reading,
    tip: built.tip,
    senses: [{ pos: built.pos, def: built.def }],
    examples: built.exampleJp || built.exampleZh ? [{ jp: built.exampleJp, zh: built.exampleZh }] : [],
    synonyms: [],
  };
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'tick': {
      const next = ensureToday(state, action.now);
      return next === state ? state : next;
    }
    case 'set-book': {
      if (!isKnownBook(state, action.bookId)) return state;
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
      if (!findWord(state, action.wordId)) return state;
      const prev = state.cards[action.wordId] ?? emptyCard();
      const card: Card = { ...prev, notebook: !prev.notebook, updatedAt: action.now };
      return { ...state, cards: { ...state.cards, [action.wordId]: card } };
    }
    case 'create-book': {
      const name = cleanBookName(action.name);
      if (!name) return state;
      const index = state.customBooks.length;
      const book: Book = {
        id: customBookId(action.now, index),
        name,
        level: '自建',
        blurb: cleanBlurb(action.blurb ?? ''),
        tint: COVER_PALETTE[index % COVER_PALETTE.length].tint,
        ink: COVER_PALETTE[index % COVER_PALETTE.length].ink,
        custom: true,
      };
      if (state.customBooks.some((item) => item.id === book.id)) return state;
      return { ...state, customBooks: [...state.customBooks, book] };
    }
    case 'delete-book': {
      if (!isCustomBook(state, action.bookId)) return state;
      const removed = new Set(state.customWords.filter((word) => word.bookId === action.bookId).map((word) => word.id));
      const cards = { ...state.cards };
      for (const id of removed) delete cards[id];
      const books = { ...state.today.books };
      delete books[action.bookId];
      return {
        ...state,
        settings: state.settings.bookId === action.bookId ? { ...state.settings, bookId: 'n5' } : state.settings,
        cards,
        today: { ...state.today, books },
        customBooks: state.customBooks.filter((book) => book.id !== action.bookId),
        customWords: state.customWords.filter((word) => word.bookId !== action.bookId),
      };
    }
    case 'add-word': {
      if (!isCustomBook(state, action.bookId)) return state;
      const built = buildCustomWord(action);
      if (!built) return state;
      const id = customWordId(action.now, state.customWords.length);
      if (wordById[id] || state.customWords.some((word) => word.id === id)) return state;
      return { ...state, customWords: [...state.customWords, toStoredWord(action.bookId, id, built)] };
    }
    case 'delete-word': {
      const word = state.customWords.find((item) => item.id === action.wordId);
      if (!word) return state;
      const cards = { ...state.cards };
      delete cards[word.id];
      return { ...state, cards, customWords: state.customWords.filter((item) => item.id !== word.id) };
    }
    case 'reset':
      return { ...freshState(action.now), customBooks: state.customBooks, customWords: state.customWords };
    case 'rate': {
      const word = findWord(state, action.wordId);
      if (!word) return state;
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
      const cards = { ...next.cards, [word.id]: card };
      updated.checkedIn = isBookGoalMet(updated, next.settings.dailyNew, remainingNew({ ...next, cards }, word.bookId));
      next = {
        ...next,
        cards,
        today: { ...next.today, books: { ...next.today.books, [word.bookId]: updated } },
      };
      return withActivity(next, action.rating);
    }
    default:
      return state;
  }
}
