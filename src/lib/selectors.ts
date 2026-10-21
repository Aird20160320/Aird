import { bookById, wordsInBook } from '../data/words';
import type { State } from '../types';
import { computeStreak, dayKey, isDue, isMastered } from './srs';

export function dashboard(state: State, now = Date.now()) {
  const date = dayKey(new Date(now));
  const current = state.today.date === date ? state : { ...state, today: { date, books: {} } };
  const book = bookById(current.settings.bookId);
  const list = wordsInBook(book.id);
  const log = current.today.books[book.id];
  const due = list.filter((word) => isDue(current.cards[word.id], now)).length;
  const remainingNew = list.filter((word) => !current.cards[word.id]?.introduced).length;
  return {
    book,
    list,
    newCount: log?.newCount ?? 0,
    reviewCount: log?.reviewCount ?? 0,
    reviewTarget: log?.reviewTarget ?? due,
    due,
    remainingNew,
    introduced: list.length - remainingNew,
    mastered: list.filter((word) => isMastered(current.cards[word.id])).length,
    notebook: Object.values(current.cards).filter((card) => card.notebook).length,
    streak: computeStreak(
      Object.entries(state.activity)
        .filter(([, activity]) => activity.checkedIn)
        .map(([day]) => day),
      date,
    ),
    checkedIn: log?.checkedIn ?? false,
    todayActivity: state.activity[date],
    date,
    total: list.length,
  };
}

export function bookProgress(state: State, bookId: string) {
  const list = wordsInBook(bookId);
  const introduced = list.filter((word) => state.cards[word.id]?.introduced).length;
  const mastered = list.filter((word) => isMastered(state.cards[word.id])).length;
  return { total: list.length, introduced, mastered };
}
