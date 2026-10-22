import { useMemo, useState } from 'react';
import { isMastered } from '../lib/srs';
import { bookProgress } from '../lib/selectors';
import { allBooks, findBook, wordsForBook } from '../lib/catalog';
import { POS_CHOICES, bookNameError, customBookId, wordDraftError } from '../lib/draft';
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
  const { state, dispatch } = useStore();
  const ui = useUi();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [blurb, setBlurb] = useState('');
  const [error, setError] = useState<string | null>(null);

  function createBook() {
    const problem = bookNameError(name);
    if (problem) {
      setError(problem);
      return;
    }
    const now = Date.now();
    const id = customBookId(now, state.customBooks.length);
    dispatch({ type: 'create-book', name, blurb, now });
    setCreating(false);
    setName('');
    setBlurb('');
    setError(null);
    ui.openBook(id);
    ui.toast('词书已建好，接着把单词加进去');
  }

  return (
    <div className="page">
      <TopBar title="词书" />
      <p className="page-lead">一次主攻一本。可以从 N5 开始，也可以自己建一本，写上想记的词。</p>
      <button className="primary create-book" type="button" onClick={() => setCreating(true)}>
        新建词书
      </button>
      <div className="book-list">
        {allBooks(state).map((book) => {
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
                <span>{book.blurb || (book.custom ? '自己添加的词书' : '')}</span>
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
      {creating ? (
        <div className="sheet-mask" onClick={() => setCreating(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-book-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="create-book-title">新建词书</h2>
            <p>写一个名称就行。单词等会儿再加。</p>
            <label className="field">
              词书名称
              <input
                value={name}
                maxLength={16}
                placeholder="例如：机场日语"
                onChange={(event) => {
                  setName(event.target.value);
                  setError(null);
                }}
              />
            </label>
            <label className="field">
              一句话介绍
              <input
                value={blurb}
                maxLength={40}
                placeholder="选填，这本词书是做什么的"
                onChange={(event) => setBlurb(event.target.value)}
              />
            </label>
            {error ? <p className="form-error">{error}</p> : null}
            <div className="spell-actions">
              <button className="text-btn" type="button" onClick={() => setCreating(false)}>
                取消
              </button>
              <button className="primary" type="button" onClick={createBook}>
                创建
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function BookDetail() {
  const { state, dispatch } = useStore();
  const ui = useUi();
  const book = findBook(state, ui.bookFocus);
  const [filter, setFilter] = useState<'all' | 'new' | 'learning' | 'mastered'>('all');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const words = book ? wordsForBook(state, book.id) : [];
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return words.filter((word) => {
      const card = state.cards[word.id];
      if (filter === 'new' && card?.introduced) return false;
      if (filter === 'learning' && (!card?.introduced || isMastered(card))) return false;
      if (filter === 'mastered' && !isMastered(card)) return false;
      if (!q) return true;
      const hay = `${word.word} ${word.reading} ${word.senses.map((sense) => sense.def).join(' ')} ${word.examples.map((example) => example.zh).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [words, filter, query, state.cards]);

  if (!book) {
    return (
      <div className="page">
        <TopBar title="词书" onBack={() => ui.go('books')} />
        <p className="empty">这本词书已经不在了</p>
      </div>
    );
  }

  const progress = bookProgress(state, book.id);
  const current = state.settings.bookId === book.id;

  return (
    <div className="page">
      <TopBar title={book.name} onBack={() => ui.go('books')} />
      <section className="book-hero">
        <Cover level={book.level} tint={book.tint} ink={book.ink} size="lg" />
        <div>
          <p>{book.blurb || (book.custom ? '自己添加的词。学法和内置词书一样。' : '')}</p>
          <p className="book-meta">
            {progress.introduced}/{progress.total} 已学 · 掌握 {progress.mastered}
          </p>
          <div className="hero-actions">
            {progress.total > 0 ? (
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
            ) : null}
            {book.custom ? (
              <button className={progress.total > 0 ? 'text-btn' : 'primary'} type="button" onClick={() => setAdding(true)}>
                添加单词
              </button>
            ) : null}
          </div>
        </div>
      </section>
      {progress.total > 0 ? (
        <>
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
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜日语、读音或中文" />
          </label>
          {list.length === 0 ? <p className="empty">没有符合的词</p> : list.map((word: Word) => <WordRow key={word.id} word={word} onClick={() => ui.openWord(word.id)} />)}
        </>
      ) : (
        <div className="empty-block">
          <p>{book.custom ? '这本词书还没有单词' : '这本词书是空的'}</p>
          <span>{book.custom ? '加上日语、读音和中文，就可以开始学。' : '先换一本有词的词书。'}</span>
        </div>
      )}
      {book.custom ? (
        <button className="danger" type="button" onClick={() => setConfirming(true)}>
          删除这本词书
        </button>
      ) : null}
      {adding ? <AddWordSheet bookId={book.id} onClose={() => setAdding(false)} /> : null}
      {confirming ? (
        <div className="sheet-mask" onClick={() => setConfirming(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-book-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="delete-book-title">删除「{book.name}」？</h2>
            <p>里面的单词和学习记录会一起消失。内置的 N5、N4、N3 和日常会话还会留着。</p>
            <div className="spell-actions">
              <button className="text-btn" type="button" onClick={() => setConfirming(false)}>
                取消
              </button>
              <button
                className="danger"
                type="button"
                onClick={() => {
                  dispatch({ type: 'delete-book', bookId: book.id });
                  setConfirming(false);
                  ui.go('books');
                  ui.toast('这本词书已删除');
                }}
              >
                删除
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function AddWordSheet({ bookId, onClose }: { bookId: string; onClose: () => void }) {
  const { dispatch } = useStore();
  const ui = useUi();
  const [word, setWord] = useState('');
  const [reading, setReading] = useState('');
  const [pos, setPos] = useState<(typeof POS_CHOICES)[number]>('名');
  const [def, setDef] = useState('');
  const [exampleJp, setExampleJp] = useState('');
  const [exampleZh, setExampleZh] = useState('');
  const [tip, setTip] = useState('');
  const [error, setError] = useState<string | null>(null);

  function save() {
    const problem = wordDraftError({ word, reading, def });
    if (problem) {
      setError(problem);
      return;
    }
    dispatch({
      type: 'add-word',
      bookId,
      word,
      reading,
      pos,
      def,
      exampleJp,
      exampleZh,
      tip,
      now: Date.now(),
    });
    ui.toast('已加入这本词书');
    onClose();
  }

  return (
    <div className="sheet-mask" onClick={onClose}>
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="add-word-title" onClick={(event) => event.stopPropagation()}>
        <header className="sheet-top">
          <h2 id="add-word-title">添加单词</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>
        <label className="field">
          日语
          <input value={word} maxLength={24} placeholder="例如：切符" onChange={(event) => { setWord(event.target.value); setError(null); }} />
        </label>
        <label className="field">
          读音
          <input value={reading} maxLength={32} lang="ja" placeholder="平假名或片假名，例如 きっぷ" onChange={(event) => { setReading(event.target.value); setError(null); }} />
        </label>
        <label className="field">
          词性
          <select value={pos} onChange={(event) => setPos(event.target.value as (typeof POS_CHOICES)[number])}>
            {POS_CHOICES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          中文释义
          <input value={def} maxLength={48} placeholder="例如：车票" onChange={(event) => { setDef(event.target.value); setError(null); }} />
        </label>
        <label className="field">
          例句（日语，选填）
          <input value={exampleJp} maxLength={80} lang="ja" placeholder="切符を買います。" onChange={(event) => setExampleJp(event.target.value)} />
        </label>
        <label className="field">
          例句（中文，选填）
          <input value={exampleZh} maxLength={80} placeholder="买车票。" onChange={(event) => setExampleZh(event.target.value)} />
        </label>
        <label className="field">
          提示（选填）
          <textarea value={tip} maxLength={80} placeholder="想记住的用法" onChange={(event) => setTip(event.target.value)} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="spell-actions">
          <button className="primary" type="button" onClick={save}>
            加入词书
          </button>
          <button className="text-btn" type="button" onClick={onClose}>
            取消
          </button>
        </div>
      </section>
    </div>
  );
}
