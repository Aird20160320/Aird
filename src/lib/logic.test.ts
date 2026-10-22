import { describe, expect, it } from 'vitest';
import { books, words, wordsInBook } from '../data/words';
import { wordsForBook } from './catalog';
import { splitHighlight } from './highlight';
import { matchesReading } from './kana';
import { freshState, reducer } from './reducer';
import { buildSession, nextQueue } from './session';
import { sanitize } from './storage';
import { dueBuckets, placeOnLadder, retentionAt, wordRetention } from './memory';
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
  it('每天新词可以改成 1 到 50 之间的数量', () => {
    let state = reducer(freshState(now), { type: 'set-daily', dailyNew: 8, now });
    expect(state.settings.dailyNew).toBe(8);
    expect(buildSession(state, now, false)).toHaveLength(8);
    expect(reducer(state, { type: 'set-daily', dailyNew: 0, now }).settings.dailyNew).toBe(8);
    expect(reducer(state, { type: 'set-daily', dailyNew: 51, now }).settings.dailyNew).toBe(8);
    const kept = sanitize({ settings: { bookId: 'n5', dailyNew: 8, autoSpeak: true, nickname: '同学' }, cards: {}, today: { date: '2026-10-21', books: {} }, activity: {} }, now);
    expect(kept.settings.dailyNew).toBe(8);
    const dropped = sanitize({ settings: { bookId: 'n5', dailyNew: 80, autoSpeak: true, nickname: '同学' }, cards: {}, today: { date: '2026-10-21', books: {} }, activity: {} }, now);
    expect(dropped.settings.dailyNew).toBe(10);
  });

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
    expect(kept.customBooks).toEqual([]);
    expect(kept.customWords).toEqual([]);
  });
});

describe('记忆曲线', () => {
  it('到了复习日，记忆大约降到 80%', () => {
    expect(retentionAt(0, 2)).toBe(1);
    expect(retentionAt(2, 2)).toBeCloseTo(0.8, 5);
    expect(retentionAt(4, 2)).toBeLessThan(0.8);
  });

  it('认识之后落在对应间隔上，过期后掉到复习线以下', () => {
    const card = applyRating(emptyCard(), 'good', now);
    expect(card.reviewedAt).toBe(now);
    const fresh = placeOnLadder(card, now);
    expect(fresh?.y).toBeCloseTo(1, 2);
    expect(fresh?.x).toBeCloseTo(1 / 8, 2);
    const halfway = placeOnLadder(card, now + DAY_MS);
    expect(halfway?.y).toBeCloseTo(Math.sqrt(0.8), 2);
    const late = placeOnLadder(card, now + 3 * DAY_MS);
    expect(late && late.y).toBeLessThan(0.8);
    expect(late?.x).toBeCloseTo(2 / 8, 2);
  });

  it('今天到期和两天后到期会落进不同的格子', () => {
    const soon = applyRating(emptyCard(), 'good', now);
    const missed = applyRating(emptyCard(), 'again', now - DAY_MS);
    expect(dueBuckets([soon, missed, emptyCard()], now, 7)).toEqual([1, 0, 1, 0, 0, 0, 0]);
    expect(wordRetention(missed, now)).toBeLessThan(0.8);
  });

  it('旧存档没有复习时间时，按到期日反推', () => {
    const sample = wordsInBook('n5')[0];
    const kept = sanitize(
      {
        settings: { bookId: 'n5', dailyNew: 10, autoSpeak: true, nickname: '同学' },
        cards: {
          [sample.id]: { introduced: true, stage: 2, due: now + 2 * DAY_MS, notebook: false, lapses: 0, reviews: 1, correct: 1, updatedAt: now },
        },
        today: { date: '2026-10-21', books: {} },
        activity: {},
      },
      now,
    );
    expect(kept.cards[sample.id].reviewedAt).toBe(now);
    expect(wordRetention(kept.cards[sample.id], now)).toBeCloseTo(1, 2);
  });
});

describe('自建词书', () => {
  function withBook(name = '机场日语') {
    return reducer(freshState(now), { type: 'create-book', name, blurb: '  出发前要会的词  ', now });
  }

  it('可以建词书并加入单词，片假名会收成平假名', () => {
    let state = withBook('  机场日语  ');
    expect(state.customBooks).toHaveLength(1);
    expect(state.customBooks[0].name).toBe('机场日语');
    expect(state.customBooks[0].level).toBe('自建');
    expect(state.customBooks[0].blurb).toBe('出发前要会的词');
    const bookId = state.customBooks[0].id;

    state = reducer(state, {
      type: 'add-word',
      bookId,
      word: ' 切符 ',
      reading: 'キップ',
      pos: '名',
      def: '车票',
      exampleJp: '切符を買います。',
      exampleZh: '买车票。',
      tip: '',
      now,
    });
    state = reducer(state, {
      type: 'add-word',
      bookId,
      word: '出口',
      reading: 'でぐち',
      pos: '名',
      def: '出口',
      now: now + 1,
    });
    expect(state.customWords[0].reading).toBe('きっぷ');
    expect(wordsForBook(state, bookId)).toHaveLength(2);
    expect(reducer(freshState(now), { type: 'create-book', name: '   ', now }).customBooks).toHaveLength(0);
    expect(reducer(state, { type: 'add-word', bookId: 'n5', word: '猫', reading: 'ねこ', pos: '名', def: '猫', now }).customWords).toHaveLength(2);
    expect(reducer(state, { type: 'add-word', bookId, word: '猫', reading: 'neko', pos: '名', def: '猫', now }).customWords).toHaveLength(2);
  });

  it('自建的词能进入学习，清空进度后词书还在', () => {
    let state = withBook();
    const bookId = state.customBooks[0].id;
    state = reducer(state, { type: 'add-word', bookId, word: '切符', reading: 'きっぷ', pos: '名', def: '车票', now });
    const wordId = state.customWords[0].id;
    state = reducer(state, { type: 'set-book', bookId });
    const session = buildSession(state, now, false);
    expect(session.map((item) => item.word.id)).toEqual([wordId]);
    state = reducer(state, { type: 'rate', wordId, rating: 'good', kind: 'new', firstPass: true, now });
    expect(state.cards[wordId].introduced).toBe(true);
    expect(state.today.books[bookId].newCount).toBe(1);

    const wiped = reducer(state, { type: 'reset', now: now + 5 });
    expect(wiped.customWords.map((word) => word.id)).toEqual([wordId]);
    expect(wiped.cards[wordId]).toBeUndefined();
    expect(wiped.settings.bookId).toBe('n5');

    const round = sanitize(state, now);
    expect(round.settings.bookId).toBe(bookId);
    expect(round.customWords[0].reading).toBe('きっぷ');
    expect(round.cards[wordId].introduced).toBe(true);

    state = reducer(state, { type: 'delete-word', wordId });
    expect(state.customWords).toHaveLength(0);
    expect(state.cards[wordId]).toBeUndefined();
    state = reducer(round, { type: 'delete-book', bookId });
    expect(state.customBooks).toHaveLength(0);
    expect(state.customWords).toHaveLength(0);
    expect(state.settings.bookId).toBe('n5');
    expect(state.today.books[bookId]).toBeUndefined();
    expect(reducer(freshState(now), { type: 'delete-book', bookId: 'n5' }).settings.bookId).toBe('n5');
  });

  it('坏掉的自建单词不会进存档', () => {
    const kept = sanitize(
      {
        settings: { bookId: 'cb-abc-0', dailyNew: 10, autoSpeak: true, nickname: '同学' },
        cards: { 'cw-abc-0': { introduced: true, stage: 2, due: 1, notebook: false, lapses: 0, reviews: 1, correct: 1, updatedAt: 1 } },
        today: { date: '2026-10-21', books: { 'cb-abc-0': { newCount: 1, reviewCount: 0, reviewTarget: 0, checkedIn: false } } },
        activity: {},
        customBooks: [{ id: 'cb-abc-0', name: '旅行', blurb: '', tint: '#7a4e9a', ink: '#f7eefe' }],
        customWords: [
          { id: 'cw-abc-0', bookId: 'cb-abc-0', word: '切符', reading: 'きっぷ', senses: [{ pos: '名', def: '车票' }], examples: [], tip: '', synonyms: [] },
          { id: 'cw-bad', bookId: 'cb-abc-0', word: '猫', reading: 'neko', senses: [{ pos: '名', def: '猫' }], examples: [], tip: '', synonyms: [] },
          { id: 'cw-gone', bookId: 'cb-missing', word: '水', reading: 'みず', senses: [{ pos: '名', def: '水' }], examples: [], tip: '', synonyms: [] },
        ],
      },
      now,
    );
    expect(kept.settings.bookId).toBe('cb-abc-0');
    expect(kept.customWords.map((word) => word.word)).toEqual(['切符']);
    expect(kept.cards['cw-abc-0'].introduced).toBe(true);
    expect(kept.today.books['cb-abc-0'].newCount).toBe(1);
  });
});
