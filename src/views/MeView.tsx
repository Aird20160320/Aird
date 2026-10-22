import { useEffect, useState } from 'react';
import { allWords } from '../lib/catalog';
import { useStore } from '../store';
import { useUi } from '../ui';
import { ShellMark } from '../components/Icons';
import { DailyGoal } from '../components/DailyGoal';
import { TopBar, WordRow } from '../components/ui';

export function MeView() {
  const { state, dispatch } = useStore();
  const ui = useUi();
  const [nickname, setNickname] = useState(state.settings.nickname);
  const [confirming, setConfirming] = useState(false);
  const notebook = Object.values(state.cards).filter((card) => card.notebook).length;

  useEffect(() => {
    setNickname(state.settings.nickname);
  }, [state.settings.nickname]);

  return (
    <div className="page">
      <TopBar title="我的" />
      <section className="profile">
        <div className="avatar lg">
          <ShellMark size={34} />
        </div>
        <label className="nick">
          <span>怎么称呼你</span>
          <input
            value={nickname}
            maxLength={12}
            onChange={(event) => setNickname(event.target.value)}
            onBlur={() => dispatch({ type: 'set-nickname', nickname })}
          />
        </label>
      </section>

      <section className="panel">
        <h2>每天学几个新词</h2>
        <DailyGoal hint="改小之后，今天如果已经学够，会马上算打卡。到期的词仍会排进复习。" />
      </section>

      <section className="panel list-panel">
        <button className="link-row" type="button" onClick={() => ui.go('notebook')}>
          <span>生词本</span>
          <strong>{notebook}</strong>
        </button>
        <button className="link-row" type="button" aria-pressed={state.settings.autoSpeak} onClick={() => dispatch({ type: 'toggle-speak' })}>
          <span>自动发音</span>
          <strong>{state.settings.autoSpeak ? '开' : '关'}</strong>
        </button>
      </section>

      <section className="panel about">
        <h2>关于</h2>
        <p>
          扇贝日语沿用扇贝的学法：选词书、定量新学、到期复习，再用认识、模糊、不认识安排下一次见面。记忆曲线从刚记住的高点往下走，降到 80% 左右时再出现。可以自己建词书，写上日语、读音和中文。内置词从 N5 到 N3，另有一本日常会话。进度和自建的词都只留在这台设备上。
        </p>
      </section>

      <button className="danger" type="button" onClick={() => setConfirming(true)}>
        清空学习记录
      </button>

      {confirming ? (
        <div className="sheet-mask" onClick={() => setConfirming(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="reset-title" onClick={(event) => event.stopPropagation()}>
            <h2 id="reset-title">清空这台设备上的进度？</h2>
            <p>词书还会留着。打卡、生词本和学习阶段会消失，不能恢复。</p>
            <div className="spell-actions">
              <button className="text-btn" type="button" onClick={() => setConfirming(false)}>
                取消
              </button>
              <button
                className="danger"
                type="button"
                onClick={() => {
                  dispatch({ type: 'reset', now: Date.now() });
                  setConfirming(false);
                  ui.toast('学习记录已清空');
                }}
              >
                清空
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function NotebookView() {
  const { state } = useStore();
  const ui = useUi();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const list = allWords(state)
    .filter((word) => state.cards[word.id]?.notebook)
    .filter((word) => !q || word.word.includes(q) || word.reading.includes(q) || word.senses.some((sense) => sense.def.toLowerCase().includes(q)))
    .sort((a, b) => (state.cards[b.id]?.updatedAt ?? 0) - (state.cards[a.id]?.updatedAt ?? 0));

  return (
    <div className="page">
      <TopBar title="生词本" onBack={() => ui.go('me')} />
      <label className="search">
        <span className="sr">搜索生词</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="在生词本里搜" />
      </label>
      {list.length === 0 ? (
        <div className="empty-block">
          <p>生词本还是空的</p>
          <span>学习时点一下书签，或者在词书里把单词加进来。</span>
        </div>
      ) : (
        list.map((word) => <WordRow key={word.id} word={word} onClick={() => ui.openWord(word.id)} />)
      )}
    </div>
  );
}
