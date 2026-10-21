import { useMemo, useState } from 'react';
import { books, bookById, wordsInBook } from '../data/words';
import { isMastered } from '../lib/srs';
import { bookProgress } from '../lib/selectors';
import { useStore } from '../store';
import { useUi } from '../ui';
import { Cover, TopBar, WordRow } from '../components/ui';
import type { Word } from '../types';

export function BooksView() {
  const ui = useUi();
  if (ui.view === 'book') return <BookDetail />;
  return <BookList />;
}

function BookList() {
  const { state } = useStore();
  const ui = useUi();
  return (
    <div className="page">
      <TopBar title="词书" />
      <p className="page-lead">一次主攻一本。今日新学和复习都记在当前词书上。</p>
      <div className="book-list">
        {books.map((book) => {
          const progress = bookProgress(state, book.id);
          const current = state.settings.bookId === book.id;
          const ratio = progress.total ? Math.round((progress.introduced / progress.total) * 100) : 0;
          return (
            <button className="book-card" type="button" key={book.id} onClick={() => ui.openBook(book.id)}>
              <Cover level={book.level} tint={book.tint} ink={book.ink} />
              <span className="book-card-copy">
                <strong>
                  {book.name}
                  {current ? <em>在学</em> : null}
                </strong>
                <span>{book.blurb}</span>
                <span className="book-meta">
                  {progress.introduced}/{progress.total} 已学
                  {progress.mastered > 0 ? ` · 掌握 ${progress.mastered}` : ''}
                </span>
                <span className="mini-track">
                  <span style={{ width: `${ratio}%` }} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BookDetail() {
  const { state, dispatch } = useStore();
  const ui = useUi();
  const book = bookById(ui.bookFocus);
  const [filter, setFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all');
  const [query, setQuery] = useState('');
  const progress = bookProgress(state, book.id);
  const current = state.settings.bookId === book.id;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return wordsInBook(book.id).filter((word) => {
      const card = state.cards[word.id];
      if (filter === 'new' && card?.introduced) return false;
      if (filter === 'learning' && (!card?.introduced || isMastered(card))) return false;
      if (filter === 'mastered' && !isMastered(card)) return false;
      if (!q) return true;
      const hay = `${word.word} ${word.senses.map((sense) => sense.def).join(' ')} ${word.examples.map((example) => example.zh).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [book.id, filter, query, state.cards]);

  return (
    <div className="page">
      <TopBar title={book.name} onBack={() => ui.go('books')} />
      <section className="book-hero">
        <Cover level={book.level} tint={book.tint} ink={book.ink} size="lg" />
        <div>
          <p>{book.blurb}</p>
          <p className="book-meta">
            {progress.introduced}/{progress.total} 已学 · 掌握 {progress.mastered}
          </p>
          <button
            className="primary"
            type="button"
            onClick={() => {
              dispatch({ type: 'set-book', bookId: book.id });
              ui.startLearn(false);
            }}
          >
            {current ? '学习这本' : '改为这本并学习'}
          </button>
        </div>
      </section>
      <div className="filters">
        {(
          [
            ['all', '全部'],
            ['new', '未学'],
            ['learning', '在学'],
            ['mastered', '掌握'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" className={filter === id ? 'chip on' : 'chip'} onClick={() => setFilter(id)} aria-pressed={filter === id}>
            {label}
          </button>
        ))}
      </div>
      <label className="search">
        <span className="sr">搜索单词</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜单词或释义" />
      </label>
      {list.length === 0 ? <p className="empty">没有符合的词</p> : list.map((word: Word) => <WordRow key={word.id} word={word} onClick={() => ui.openWord(word.id)} />)}
    </div>
  );
}
