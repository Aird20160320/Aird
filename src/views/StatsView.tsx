import { useState } from 'react';
import { words } from '../data/words';
import { dayKey, isMastered, prevDay } from '../lib/srs';
import { dashboard } from '../lib/selectors';
import { useStore } from '../store';
import { TopBar } from '../components/ui';

export function StatsView() {
  const { state } = useStore();
  const home = dashboard(state);
  const learned = Object.values(state.cards).filter((card) => card.introduced).length;
  const mastered = Object.values(state.cards).filter((card) => isMastered(card)).length;
  const reviews = Object.values(state.cards).reduce((sum, card) => sum + card.reviews, 0);
  const correct = Object.values(state.cards).reduce((sum, card) => sum + card.correct, 0);
  const accuracy = reviews === 0 ? 0 : Math.round((correct / reviews) * 100);
  const days = lastDays(home.date, 7);
  const max = Math.max(1, ...days.map((day) => (state.activity[day]?.newCount ?? 0) + (state.activity[day]?.reviewCount ?? 0)));

  return (
    <div className="page">
      <TopBar title="统计" />
      <section className="stat-grid loose">
        <article>
          <b>{learned}</b>
          <span>累计已学</span>
        </article>
        <article>
          <b>{mastered}</b>
          <span>已掌握</span>
        </article>
        <article>
          <b>{home.streak}</b>
          <span>连续天数</span>
        </article>
        <article>
          <b>{accuracy}%</b>
          <span>记得率</span>
        </article>
      </section>
      <section className="panel">
        <h2>近 7 天</h2>
        <div className="bars">
          {days.map((day) => {
            const amount = (state.activity[day]?.newCount ?? 0) + (state.activity[day]?.reviewCount ?? 0);
            return (
              <div className="bar-col" key={day}>
                <div className="bar-track">
                  <div style={{ height: `${Math.round((amount / max) * 100)}%` }} />
                </div>
                <span>{Number(day.slice(-2))}</span>
              </div>
            );
          })}
        </div>
        <p className="meter-hint">柱子是当天新学加复习的词数。词库一共 {words.length} 个词。</p>
      </section>
      <Calendar />
    </div>
  );
}

function lastDays(today: string, count: number): string[] {
  const days = [today];
  let cursor = today;
  for (let index = 1; index < count; index += 1) {
    cursor = prevDay(cursor);
    days.push(cursor);
  }
  return days.reverse();
}

function Calendar() {
  const { state } = useStore();
  const [cursor, setCursor] = useState(() => new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array.from({ length: lead }, () => null), ...Array.from({ length: days }, (_, index) => index + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const now = new Date();
  const todayKey = dayKey(now);
  const atCurrent = year === now.getFullYear() && month === now.getMonth();

  return (
    <section className="panel">
      <div className="cal-head">
        <button type="button" className="icon-btn" aria-label="上个月" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          ‹
        </button>
        <h2>
          {year}年{month + 1}月
        </h2>
        <button type="button" className="icon-btn" aria-label="下个月" disabled={atCurrent} onClick={() => setCursor(new Date(year, month + 1, 1))}>
          ›
        </button>
      </div>
      <div className="cal-week">
        {['一', '二', '三', '四', '五', '六', '日'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((day, index) => {
          if (!day) return <span key={`e-${index}`} />;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const activity = state.activity[key];
          const classes = ['cal-day'];
          if (activity?.checkedIn) classes.push('checked');
          else if ((activity?.newCount ?? 0) + (activity?.reviewCount ?? 0) > 0) classes.push('partial');
          if (key === todayKey) classes.push('today');
          return (
            <span key={key} className={classes.join(' ')}>
              {day}
            </span>
          );
        })}
      </div>
      <p className="meter-hint">填满的日子是完成了当天新学和复习。只学了一部分会留一个浅色点。</p>
    </section>
  );
}
