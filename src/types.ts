export type Rating = 'again' | 'hard' | 'good' | 'easy';

export const DAILY_CHOICES = [5, 10, 15, 20, 30] as const;
export const DAILY_MIN = 1;
export const DAILY_MAX = 50;

export function isDailyNew(value: number): boolean {
  return Number.isInteger(value) && value >= DAILY_MIN && value <= DAILY_MAX;
}

export type Sense = { pos: string; def: string };
export type Example = { jp: string; zh: string };

export type Word = {
  id: string;
  bookId: string;
  word: string;
  reading: string;
  tip: string;
  senses: Sense[];
  examples: Example[];
  synonyms: string[];
};

export type Book = {
  id: string;
  name: string;
  level: string;
  blurb: string;
  tint: string;
  ink: string;
  custom?: boolean;
};

export type Card = {
  introduced: boolean;
  stage: number;
  due: number;
  notebook: boolean;
  lapses: number;
  reviews: number;
  correct: number;
  updatedAt: number;
  reviewedAt: number;
};

export type BookDay = {
  newCount: number;
  reviewCount: number;
  reviewTarget: number;
  checkedIn: boolean;
};

export type DayRecord = {
  date: string;
  books: Record<string, BookDay>;
};

export type Activity = {
  newCount: number;
  reviewCount: number;
  checkedIn: boolean;
  again: number;
  hard: number;
  good: number;
  easy: number;
};

export type Settings = {
  bookId: string;
  dailyNew: number;
  autoSpeak: boolean;
  nickname: string;
};

export type State = {
  settings: Settings;
  cards: Record<string, Card>;
  today: DayRecord;
  activity: Record<string, Activity>;
  customBooks: Book[];
  customWords: Word[];
};
