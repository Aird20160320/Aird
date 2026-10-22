import { books, isBookId, wordById, words } from '../data/words';
import type { Book, State, Word } from '../types';

export function allBooks(state: State): Book[] {
  return [...books, ...state.customBooks];
}

export function allWords(state: State): Word[] {
  return [...words, ...state.customWords];
}

export function findBook(state: State, id: string): Book | undefined {
  return allBooks(state).find((book) => book.id === id);
}

export function findWord(state: State, id: string): Word | undefined {
  return wordById[id] ?? state.customWords.find((word) => word.id === id);
}

export function wordsForBook(state: State, bookId: string): Word[] {
  return allWords(state).filter((word) => word.bookId === bookId);
}

export function isKnownBook(state: State, id: string): boolean {
  return isBookId(id) || state.customBooks.some((book) => book.id === id);
}

export function isCustomBook(state: State, id: string): boolean {
  return state.customBooks.some((book) => book.id === id);
}
