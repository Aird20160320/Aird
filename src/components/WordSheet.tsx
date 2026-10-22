import { useEffect, useState } from 'react';
import type { Word } from '../types';
import { books } from '../data/words';
import { findBook } from '../lib/catalog';
import { matchesReading } from '../lib/kana';
import { formatReviewDay, stageLabel } from '../lib/srs';
import { speak } from '../lib/speech';
import { useStore } from '../store';
import { useUi } from '../ui';
import { IconClose, IconVolume } from './Icons';
import { Highlight } from './ui';

export function WordSheet({ word, onClose }: { word: Word; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const ui = useUi();
  const card = state.cards[word.id];
  const book = findBook(state, word.bookId) ?? books[0];
  const [spelling, setSpelling] = useState(false);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState<'ok' | 'bad' | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setSpelling(false);
    setGuess('');
    setResult(null);
    setConfirming(false);
  }, [word.id]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function checkSpell() {
    setResult(matchesReading(guess, word.word, word.reading) ? 'ok' : 'bad');
  }

  return (
    <div className="sheet-mask" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="word-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="sheet-top">
          <span className="sheet-book" style={{ color: book.tint }}>
            {book.name}
          </span>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="关闭">
            <IconClose />
          </button>
        </header>

        {spelling ? (
          <div className="spell">
            <p className="spell-lead">看释义，写出平假名读音</p>
            {word.senses.map((sense) => (
              <p className="sense" key={sense.def}>
                <span>{sense.pos}</span>
                {sense.def}
              </p>
            ))}
            <input
              value={guess}
              onChange={(event) => {
                setGuess(event.target.value);
                setResult(null);
              }}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              lang="ja"
              placeholder="输入平假名"
              aria-label="读音"
              onKeyDown={(event) => {
                if (event.key === 'Enter') checkSpell();
              }}
            />
            {result === 'ok' ? <p className="spell-ok">拼对了</p> : null}
            {result === 'bad' ? <p className="spell-bad">还不一致，再试一次</p> : null}
            <div className="spell-actions">
              <button className="primary" type="button" onClick={checkSpell}>
                检查
              </button>
              <button className="text-btn" type="button" onClick={() => setSpelling(false)}>
                看单词
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 id="word-sheet-title" className="word-title sheet-word">
              {word.word}
            </h2>
            <p className="phonetic-line">
              {word.reading !== word.word ? <span>{word.reading}</span> : null}
              <button
                className="speak-btn"
                type="button"
                aria-label="朗读"
                onClick={() => {
                  if (!speak(word.reading)) ui.toast('这台设备暂时不能朗读');
                }}
              >
                <IconVolume />
              </button>
            </p>
            <p className="sheet-status">{card?.introduced ? `${stageLabel(card)} · ${formatReviewDay(card.due)}` : '还没有学过'}</p>
            {word.senses.map((sense) => (
              <p className="sense" key={sense.pos + sense.def}>
                <span>{sense.pos}</span>
                {sense.def}
              </p>
            ))}
            {word.examples.map((example) => (
              <blockquote className="example" key={example.jp}>
                <p>
                  <Highlight text={example.jp} word={word.word} />
                </p>
                <p>{example.zh}</p>
              </blockquote>
            ))}
            {word.synonyms.length > 0 ? (
              <p className="synonyms">
                相关
                {word.synonyms.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </p>
            ) : null}
            {word.tip ? <p className="tip">{word.tip}</p> : null}
            <div className="spell-actions">
              <button
                className="primary"
                type="button"
                onClick={() => {
                  const next = !card?.notebook;
                  dispatch({ type: 'toggle-notebook', wordId: word.id, now: Date.now() });
                  ui.toast(next ? '已加入生词本' : '已移出生词本');
                }}
              >
                {card?.notebook ? '移出生词本' : '加入生词本'}
              </button>
              <button className="text-btn" type="button" onClick={() => setSpelling(true)}>
                读音自测
              </button>
            </div>
            {book.custom ? (
              confirming ? (
                <div className="delete-confirm">
                  <p>这个词和它的学习记录会从词书里消失。</p>
                  <div className="spell-actions">
                    <button className="text-btn" type="button" onClick={() => setConfirming(false)}>
                      取消
                    </button>
                    <button
                      className="danger"
                      type="button"
                      onClick={() => {
                        dispatch({ type: 'delete-word', wordId: word.id });
                        ui.toast('已从词书删除');
                        onClose();
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ) : (
                <button className="quiet-danger" type="button" onClick={() => setConfirming(true)}>
                  从这本词书删除
                </button>
              )
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
