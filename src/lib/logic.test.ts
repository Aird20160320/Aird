import { describe, expect, it } from 'vitest';
import { books, words, wordsInBook } from '../data/words';
import { splitHighlight } from './highlight';
import { matchesReading } from './kana';
import { freshState, reducer } from './reducer';
import { buildSession, nextQueue } from './session';
import { sanitize } from './storage';
import { applyRating, computeStreak, DAY_MS, dayKey, emptyCard, isBookGoalMet, prevDay, previewDelay, reviewMeter } from './srs';

const now = new Date(2026, 9, 21, 8, 30, 0).getTime();

describe('词库', () => {
  it('每本词书都有足够的词，且编号不重复', () => {
    const ids = words.map((word) => word.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const book of books) {
      expect(wordsInBook(book.id).length).toBeGreaterThanOrEqual(16);
    }
  });

  it('例句里能标出单词本身，读音是假名', () => {
    for (const word of words) {
      expect(word.senses.length).toBeGreaterThan(0);
      expect(word.reading).toMatch(/^[\u3040-\u309f]+$/);
      for (const example of word.examples) {
        expect(splitHighlight(example.jp, word.word).some((part) => part.hit)).toBe(true);
      }
    }
  });

  it('读音自测接受平假名和片假名', () => {
    expect(matchesReading('たべる', '食べる', 'たべる')).toBe(true);
    expect(matchesReading('タベル', '食べる', 'たべる')).toBe(true);
    expect(matchesReading('のむ', '食べる', 'たべる')).toBe(false);
    expect(splitHighlight('朝はパンを食べる。', '食べる').some((part) => part.hit)).toBe(true);
  });
});

describe('间隔', () => {
  it('新词的四种选择间隔不同', () => {
    const labels = ['again', 'hard', 'good', 'easy'].map((rating) => previewDelay(0, rating as 'again' | 'hard' | 'good' | 'easy'));
    expect(new Set(labels).size).toBe(4);
    expect(labels[0]).toBe('马上');
  });

  it('认识会升阶段，不认识会打回马上复习', () => {
    const known = applyRating(emptyCard(), 'good', now);
    expect(known.introduced).toBe(true);
    expect(known.stage).toBe(2);
    expect(known.due).toBe(now + 2 * DAY_MS);
    const missed = applyRating(known, 'again', now + 1000);
    expect(missed.stage).toBe(0);
    expect(missed.due).toBe(now + 1000);
    expect(missed.lapses).toBe(1);
  });

  it('打卡需要学完当天的新词和复习', () => {
    expect(isBookGoalMet({ newCount: 0, reviewCount: 0, reviewTarget: 0 }, 10, 20)).toBe(false);
    expect(isBookGoalMet({ newCount: 10, reviewCount: 0, reviewTarget: 0 }, 10, 8)).toBe(true);
    expect(isBookGoalMet({ newCount: 3, reviewCount: 2, reviewTarget: 2 }, 10, 0)).toBe(true);
    expect(isBookGoalMet({ newCount: 3, reviewCount: 1, reviewTarget: 2 }, 10, 0)).toBe(false);
  });

  it('刚记错的词会立刻出现在复习进度里', () => {
    expect(reviewMeter(0, 0, 1)).toEqual({ value: 0, total: 1 });
    expect(reviewMeter(3, 2, 1)).toEqual({ value: 2, total: 3 });
    expect(reviewMeter(0, 1, 0)).toEqual({ value: 1, total: 1 });
  });

  it('连续天数遇到空档就停下，今天没打卡仍算昨天', () => {
    expect(computeStreak([], '2026-10-21')).toBe(0);
    expect(computeStreak(['2026-10-20'], '2026-10-21')).toBe(1);
    expect(computeStreak(['2026-10-20', '2026-10-21'], '2026-10-21')).toBe(2);
    expect(computeStreak(['2026-10-18', '2026-10-20', '2026-10-21'], '2026-10-21')).toBe(2);
    expect(prevDay('2026-10-01')).toBe('2026-09-30');
  });
});

describe('一组学习', () => {
  it('按每日新词数量组队列，加量最多五个', () => {
    const state = freshState(now);
    expect(buildSession(state, now, false)).toHaveLength(10);
    expect(buildSession(state, now, true)).toHaveLength(5);
    expect(buildSession(state, now, false).every((item) => item.kind === 'new')).toBe(true);
  });

  it('不认识的词插回队列，连错两次后先离开', () => {
    const list = wordsInBook('n5');
    const queue = list.slice(0, 4).map((word) => ({ word, kind: 'new' as const, passes: 0 }));
    const again = nextQueue(queue, 'again');
    expect(again.map((item) => item.word.id)).toEqual([list[1].id, list[2].id, list[0].id, list[3].id]);
    expect(again[2].passes).toBe(1);
    const gone = nextQueue([{ ...queue[0], passes: 2 }], 'again');
    expect(gone).toHaveLength(0);
  });
});

describe('进度', () => {
  it('学满目标后打卡，调高目标会取消当天打卡', () => {
    let state = reducer(freshState(now), { type: 'set-daily', dailyNew: 5, now });
    const list = wordsInBook('n5');
    for (let index = 0; index < 4; index += 1) {
      state = reducer(state, { type: 'rate', wordId: list[index].id, rating: 'good', kind: 'new', firstPass: true, now });
    }
    expect(state.today.books.n5.checkedIn).toBe(false);
    const missed = list[4];
    state = reducer(state, { type: 'rate', wordId: missed.id, rating: 'again', kind: 'new', firstPass: true, now });
    expect(state.today.books.n5.newCount).toBe(5);
    expect(state.today.books.n5.checkedIn).toBe(true);
    expect(state.cards[missed.id].due).toBe(now);
    expect(state.activity[dayKey(new Date(now))].checkedIn).toBe(true);

    const review = buildSession(state, now, false);
    expect(review.some((item) => item.word.id === missed.id && item.kind === 'review')).toBe(true);
    expect(review.some((item) => item.kind === 'new')).toBe(false);

    state = reducer(state, { type: 'set-daily', dailyNew: 10, now });
    expect(state.today.books.n5.checkedIn).toBe(false);
    state = reducer(state, { type: 'set-daily', dailyNew: 5, now });
    expect(state.today.books.n5.checkedIn).toBe(true);

    state = reducer(state, { type: 'toggle-notebook', wordId: list[5].id, now });
    expect(state.cards[list[5].id].notebook).toBe(true);
    expect(state.cards[list[5].id].introduced).toBe(false);
    state = reducer(state, { type: 'rate', wordId: list[5].id, rating: 'good', kind: 'new', firstPass: true, now });
    expect(state.cards[list[5].id].notebook).toBe(true);
    expect(state.cards[list[5].id].introduced).toBe(true);
  });

  it('跨天后保留昨天的打卡', () => {
    let state = reducer(freshState(now), { type: 'set-daily', dailyNew: 5, now });
    const list = wordsInBook('n5');
    for (const word of list.slice(0, 5)) {
      state = reducer(state, { type: 'rate', wordId: word.id, rating: 'easy', kind: 'new', firstPass: true, now });
    }
    const tomorrow = now + DAY_MS;
    state = reducer(state, { type: 'tick', now: tomorrow });
    expect(state.today.date).toBe(dayKey(new Date(tomorrow)));
    expect(state.today.books.n5).toBeUndefined();
    expect(state.activity[dayKey(new Date(now))].checkedIn).toBe(true);
    expect(computeStreak(Object.keys(state.activity).filter((day) => state.activity[day].checkedIn), state.today.date)).toBe(1);
  });

  it('损坏的存档会回到干净的初始状态', () => {
    expect(sanitize(null, now).settings.bookId).toBe('n5');
    const sample = wordsInBook('n5')[0];
    const kept = sanitize(
      {
        settings: { bookId: 'n3', dailyNew: 15, autoSpeak: false, nickname: '  埃里克同学超出了 ' },
        cards: {
          [sample.id]: { introduced: false, stage: 6, due: 1, notebook: true, lapses: 0, reviews: 0, correct: 0, updatedAt: 1 },
          missing: { introduced: true },
        },
        today: { date: '2026-10-21', books: { cet4: { newCount: 1, reviewCount: 0, reviewTarget: 0, checkedIn: true } } },
        activity: {},
      },
      now,
    );
    expect(kept.settings.bookId).toBe('n3');
    expect(kept.settings.dailyNew).toBe(15);
    expect(kept.settings.nickname).toBe('埃里克同学超出了');
    expect(kept.cards[sample.id].stage).toBe(0);
    expect(kept.cards[sample.id].notebook).toBe(true);
    expect(kept.cards.missing).toBeUndefined();
    expect(kept.today.books.cet4).toBeUndefined();
  });
});
