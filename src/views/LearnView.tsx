import { useEffect, useRef, useState } from 'react';
import { IconBookmark, IconClose, IconVolume } from '../components/Icons';
import { Highlight } from '../components/ui';
import { wordsInBook } from '../data/words';
import { buildSession, nextQueue, type SessionItem } from '../lib/session';
import { speak, stopSpeaking } from '../lib/speech';
import { formatChineseDate, previewDelay } from '../lib/srs';
import { dashboard } from '../lib/selectors';
import { useStore } from '../store';
import type { Rating } from '../types';
import { useUi } from '../ui';

const RATINGS: { id: Rating; label: string }[] = [
  { id: 'again', label: '不认识' },
  { id: 'hard', label: '模糊' },
  { id: 'good', label: '认识' },
  { id: 'easy', label: '太简单' },
];

export function LearnView({ extra }: { extra: boolean }) {
  const { state, dispatch } = useStore();
  const ui = useUi();
  const [queue, setQueue] = useState<SessionItem[]>(() => buildSession(state, Date.now(), extra));
  const [total] = useState(queue.length);
  const [done, setDone] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [counts, setCounts] = useState({ again: 0, hard: 0, good: 0, easy: 0, news: 0, reviews: 0 });
  const current = queue[0];

  const rateRef = useRef<(rating: Rating) => void>(() => undefined);
  const revealRef = useRef<() => void>(() => undefined);
  revealRef.current = () => setRevealed(true);

  useEffect(() => {
    if (!current || !state.settings.autoSpeak) return;
    speak(current.word.reading);
    return () => stopSpeaking();
  }, [current, state.settings.autoSpeak]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (!current) return;
      if ((event.key === ' ' || event.key === 'Enter') && !revealed) {
        event.preventDefault();
        revealRef.current();
        return;
      }
      if (!revealed) return;
      const map: Record<string, Rating> = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' };
      const rating = map[event.key];
      if (!rating) return;
      event.preventDefault();
      rateRef.current(rating);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, revealed]);

  function rate(rating: Rating) {
    if (!current) return;
    const firstPass = current.passes === 0;
    dispatch({
      type: 'rate',
      wordId: current.word.id,
      rating,
      kind: current.kind,
      firstPass,
      now: Date.now(),
    });
    setCounts((prev) => ({
      ...prev,
      [rating]: prev[rating] + 1,
      news: prev.news + (firstPass && current.kind === 'new' ? 1 : 0),
      reviews: prev.reviews + (firstPass && current.kind === 'review' ? 1 : 0),
    }));
    const leaving = rating !== 'again' || current.passes >= 2;
    if (leaving) setDone((value) => value + 1);
    setQueue((items) => nextQueue(items, rating));
    setRevealed(false);
  }

  rateRef.current = rate;

  if (!current) {
    return <Summary total={total} counts={counts} extra={extra} />;
  }

  const card = state.cards[current.word.id];
  const stage = card?.stage ?? 0;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const kindLabel = current.passes > 0 ? '巩固' : current.kind === 'new' ? '新词' : '复习';

  return (
    <div className="learn">
      <header className="learn-top">
        <button className="icon-btn" type="button" onClick={() => ui.go('home')} aria-label="结束学习">
          <IconClose />
        </button>
        <div className="learn-progress" aria-hidden="true">
          <div style={{ width: `${progress}%` }} />
        </div>
        <span className="learn-count">本组 {done}/{total}</span>
        <button
          className={`icon-btn bookmark ${card?.notebook ? 'on' : ''}`}
          type="button"
          aria-label={card?.notebook ? '移出生词本' : '加入生词本'}
          aria-pressed={!!card?.notebook}
          onClick={() => {
            const next = !card?.notebook;
            dispatch({ type: 'toggle-notebook', wordId: current.word.id, now: Date.now() });
            ui.toast(next ? '已加入生词本' : '已移出生词本');
          }}
        >
          <IconBookmark filled={!!card?.notebook} />
        </button>
      </header>

      <div
        className={`learn-body ${revealed ? '' : 'is-hidden'}`}
        onClick={() => {
          if (!revealed) setRevealed(true);
        }}
      >
        <p className="kind-line">
          <span>{kindLabel}</span>
        </p>
        <h2 className="word-title">{current.word.word}</h2>
        <p className="phonetic-line">
          {revealed && current.word.reading !== current.word.word ? <span>{current.word.reading}</span> : null}
          <button
            className="speak-btn"
            type="button"
            aria-label="朗读"
            onClick={(event) => {
              event.stopPropagation();
              if (!speak(current.word.reading)) ui.toast('这台设备暂时不能朗读');
            }}
          >
            <IconVolume />
          </button>
        </p>

        {revealed ? (
          <div className="meaning">
            {current.word.senses.map((sense) => (
              <p className="sense" key={sense.pos + sense.def}>
                <span>{sense.pos}</span>
                {sense.def}
              </p>
            ))}
            {current.word.examples.map((example) => (
              <blockquote className="example" key={example.jp}>
                <p>
                  <Highlight text={example.jp} word={current.word.word} />
                </p>
                <p>{example.zh}</p>
              </blockquote>
            ))}
            {current.word.synonyms.length > 0 ? (
              <p className="synonyms">
                相关
                {current.word.synonyms.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </p>
            ) : null}
            <p className="tip">{current.word.tip}</p>
          </div>
        ) : (
          <button
            className="recall"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setRevealed(true);
            }}
          >
            先回忆读音和意思，再点开
          </button>
        )}
      </div>

      {revealed ? (
        <footer className="rates">
          <p className="kbd-hint">1 不认识 · 2 模糊 · 3 认识 · 4 太简单</p>
          <div className="rate-row">
            {RATINGS.map((item) => (
              <button className={`rate ${item.id}`} type="button" key={item.id} onClick={() => rate(item.id)}>
                <strong>{item.label}</strong>
                <span>{previewDelay(stage, item.id)}</span>
              </button>
            ))}
          </div>
        </footer>
      ) : (
        <footer className="reveal-foot">
          <p className="kbd-hint">空格键也可以显示释义</p>
          <button className="reveal-btn" type="button" onClick={() => setRevealed(true)}>
            显示释义
          </button>
        </footer>
      )}
    </div>
  );
}

function Summary({
  total,
  counts,
  extra,
}: {
  total: number;
  counts: { again: number; hard: number; good: number; easy: number; news: number; reviews: number };
  extra: boolean;
}) {
  const { state } = useStore();
  const ui = useUi();
  const home = dashboard(state);
  const remaining = wordsInBook(state.settings.bookId).filter((word) => !state.cards[word.id]?.introduced).length;
  const empty = total === 0;

  async function copySummary() {
    const text = `扇贝日语 ${formatChineseDate()}\n新学 ${home.newCount} · 复习 ${home.reviewCount}\n连续 ${home.streak} 天`;
    try {
      await navigator.clipboard.writeText(text);
      ui.toast('今日小结已复制');
    } catch {
      ui.toast('没能复制，可以手动记一下');
    }
  }

  return (
    <section className="done">
      <div className={`seal ${home.checkedIn ? 'stamped' : ''}`}>{home.checkedIn ? '已打卡' : empty ? '今天' : '完成'}</div>
      <h2>{empty ? '这组里暂时没有词' : home.checkedIn ? '今天的计划完成了' : '这组学完了'}</h2>
      <p className="done-lead">
        {empty
          ? extra
            ? '新词已经学完，去换一本词书吧。'
            : '新学名额和到期复习都空着。'
          : `本组新学 ${counts.news}，复习 ${counts.reviews}`}
      </p>
      {!empty ? (
        <ul className="done-stats">
          <li>
            <b>{counts.again}</b>
            <span>不认识</span>
          </li>
          <li>
            <b>{counts.hard}</b>
            <span>模糊</span>
          </li>
          <li>
            <b>{counts.good}</b>
            <span>认识</span>
          </li>
          <li>
            <b>{counts.easy}</b>
            <span>太简单</span>
          </li>
        </ul>
      ) : null}
      <p className="done-today">
        今日新学 {home.newCount}/{state.settings.dailyNew}
        {home.checkedIn ? ' · 已计入连续打卡' : ''}
      </p>
      <button className="primary xl" type="button" onClick={() => ui.go('home')}>
        返回首页
      </button>
      {remaining > 0 ? (
        <button className="text-btn" type="button" onClick={() => ui.startLearn(true)}>
          再学 5 个
        </button>
      ) : null}
      <button className="text-btn quiet" type="button" onClick={() => void copySummary()}>
        复制今日小结
      </button>
    </section>
  );
}
