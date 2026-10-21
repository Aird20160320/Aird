import type { ReactNode } from 'react';
import type { Word } from '../types';
import { splitHighlight } from '../lib/highlight';
import { formatReviewDay, stageLabel } from '../lib/srs';
import { useStore } from '../store';
import { IconBack } from './Icons';

export function TopBar({ title, onBack, extra }: { title: string; onBack?: () => void; extra?: ReactNode }) {
  return (
    <header className="topbar">
      {onBack ? (
        <button className="icon-btn" type="button" onClick={onBack} aria-label="返回">
          <IconBack />
        </button>
      ) : (
        <span className="icon-spacer" />
      )}
      <h1>{title}</h1>
      <div className="topbar-extra">{extra}</div>
    </header>
  );
}

export function Meter({ label, value, total, hint }: { label: string; value: number; total: number; hint?: string }) {
  const ratio = total <= 0 ? 0 : Math.min(100, Math.round((value / total) * 100));
  return (
    <div className="meter">
      <div className="meter-top">
        <span>{label}</span>
        <strong>
          {value}
          <em>/{total}</em>
        </strong>
      </div>
      <div className="track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={Math.max(total, value)} aria-label={label}>
        <div className="fill" style={{ width: `${ratio}%` }} />
      </div>
      {hint ? <p className="meter-hint">{hint}</p> : null}
    </div>
  );
}

export function Highlight({ text, word }: { text: string; word: string }) {
  return (
    <>
      {splitHighlight(text, word).map((part, index) =>
        part.hit ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>,
      )}
    </>
  );
}

export function WordRow({ word, onClick }: { word: Word; onClick: () => void }) {
  const { state } = useStore();
  const card = state.cards[word.id];
  const sense = word.senses[0];
  return (
    <button className="word-row" type="button" onClick={onClick}>
      <span>
        <strong>{word.word}</strong>
        <em>
          {sense?.pos} {sense?.def}
        </em>
      </span>
      <small>{card?.introduced ? `${stageLabel(card)} · ${formatReviewDay(card.due)}` : '未学'}</small>
    </button>
  );
}

export function Cover({ level, tint, ink, size = 'md' }: { level: string; tint: string; ink: string; size?: 'md' | 'lg' }) {
  return (
    <span className={`cover cover-${size}`} style={{ background: tint, color: ink }}>
      {level}
    </span>
  );
}
