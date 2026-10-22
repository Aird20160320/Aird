import { useEffect, useRef, useState } from 'react';
import { findWord } from './lib/catalog';
import { WordSheet } from './components/WordSheet';
import { IconBook, IconChart, IconHome, IconUser, ShellMark } from './components/Icons';
import { BooksView } from './views/BooksView';
import { HomeView } from './views/HomeView';
import { LearnView } from './views/LearnView';
import { MeView, NotebookView } from './views/MeView';
import { StatsView } from './views/StatsView';
import { useStore } from './store';
import { UiProvider, type View } from './ui';

const TABS = [
  { id: 'home', label: '学习' },
  { id: 'books', label: '词书' },
  { id: 'stats', label: '统计' },
  { id: 'me', label: '我的' },
] as const;

function TabIcon({ id }: { id: (typeof TABS)[number]['id'] }) {
  if (id === 'home') return <IconHome />;
  if (id === 'books') return <IconBook />;
  if (id === 'stats') return <IconChart />;
  return <IconUser />;
}

function tabOf(view: View): 'home' | 'books' | 'stats' | 'me' | null {
  if (view === 'learn') return null;
  if (view === 'home') return 'home';
  if (view === 'books' || view === 'book') return 'books';
  if (view === 'stats') return 'stats';
  return 'me';
}

export function App() {
  const { state, dispatch } = useStore();
  const [view, setView] = useState<View>('home');
  const [bookFocus, setBookFocus] = useState(state.settings.bookId);
  const [extra, setExtra] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  function toast(text: string) {
    setMessage(text);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 2200);
  }

  function go(next: View) {
    setSheetId(null);
    setView(next);
  }

  useEffect(() => {
    scroller.current?.scrollTo(0, 0);
  }, [view, bookFocus, sessionKey]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const tab = tabOf(view);
  const sheetWord = sheetId ? findWord(state, sheetId) : undefined;

  return (
    <UiProvider
      value={{
        view,
        bookFocus,
        extra,
        openWord: (id) => setSheetId(id),
        go,
        openBook: (id) => {
          setBookFocus(id);
          setSheetId(null);
          setView('book');
        },
        startLearn: (isExtra = false) => {
          dispatch({ type: 'tick', now: Date.now() });
          setExtra(isExtra);
          setSessionKey((key) => key + 1);
          setSheetId(null);
          setView('learn');
        },
        toast,
      }}
    >
      <div className="desk">
        <aside className="desk-copy">
          <div className="brand-row">
            <ShellMark size={26} />
            <span>扇贝日语</span>
          </div>
          <h2>每天一小组，把日语记住。</h2>
          <ul>
            <li>从 N5 开始，也可以自己建词书</li>
            <li>先回忆读音和意思</li>
            <li>不认识的词很快再见面</li>
            <li>完成计划就打卡</li>
          </ul>
        </aside>
        <div className="frame">
          <div ref={scroller} className={`screen-scroll ${view === 'learn' ? 'is-locked' : ''}`}>
            {view === 'home' ? <HomeView /> : null}
            {view === 'learn' ? <LearnView key={sessionKey} extra={extra} /> : null}
            {view === 'books' || view === 'book' ? <BooksView /> : null}
            {view === 'stats' ? <StatsView /> : null}
            {view === 'me' ? <MeView /> : null}
            {view === 'notebook' ? <NotebookView /> : null}
          </div>
          {tab ? (
            <nav className="tabbar" aria-label="主导航">
              {TABS.map((item) => (
                <button key={item.id} type="button" className="tab" aria-current={tab === item.id ? 'page' : undefined} onClick={() => go(item.id)}>
                  <TabIcon id={item.id} />
                  {item.label}
                </button>
              ))}
            </nav>
          ) : null}
          {sheetWord ? <WordSheet word={sheetWord} onClose={() => setSheetId(null)} /> : null}
          {message ? (
            <div className="toast" role="status">
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </UiProvider>
  );
}
