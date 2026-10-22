import { buildSession } from '../lib/session';
import { formatChineseDate, greeting, reviewMeter } from '../lib/srs';
import { dashboard } from '../lib/selectors';
import { useStore } from '../store';
import { ShellMark } from '../components/Icons';
import { DailyGoal } from '../components/DailyGoal';
import { Cover, Meter } from '../components/ui';
import { useUi } from '../ui';

export function HomeView() {
  const { state } = useStore();
  const ui = useUi();
  const now = Date.now();
  const home = dashboard(state, now);
  const queue = buildSession(state, now, false);
  const reviews = queue.filter((item) => item.kind === 'review').length;
  const news = queue.filter((item) => item.kind === 'new').length;
  const review = reviewMeter(home.reviewTarget, home.reviewCount, home.due);

  let label = '开始学习';
  if (reviews > 0 && news === 0) label = '开始复习';
  if (reviews === 0 && news > 0) label = '学习新词';

  return (
    <div className="home">
      <header className="home-top">
        <div>
          <p className="eyebrow">{formatChineseDate()}</p>
          <h1>
            {greeting()}，{state.settings.nickname}
          </h1>
          <p className="streak-pill">连续学习 {home.streak} 天</p>
        </div>
        <div className="avatar" aria-hidden="true">
          <ShellMark size={30} />
        </div>
      </header>

      <section className="goal">
        <div className="goal-head">
          <h2>今日计划</h2>
          <span className={home.checkedIn ? 'pill ok' : 'pill'}>{home.checkedIn ? '已打卡' : '未打卡'}</span>
        </div>
        <Meter label="新学" value={home.newCount} total={state.settings.dailyNew} />
        <DailyGoal />
        <Meter label="复习" value={review.value} total={review.total} hint={review.total === 0 ? '今天没有到期的词' : undefined} />
        {queue.length > 0 ? (
          <button className="primary xl" type="button" onClick={() => ui.startLearn(false)}>
            {label}
          </button>
        ) : home.remainingNew > 0 ? (
          <>
            <p className="done-note">今日计划已完成</p>
            <button className="primary xl" type="button" onClick={() => ui.startLearn(true)}>
              再学 5 个
            </button>
          </>
        ) : home.total === 0 ? (
          <>
            <p className="done-note">这本词书还没有单词</p>
            <button className="primary xl" type="button" onClick={() => ui.openBook(home.book.id)}>
              去添加单词
            </button>
          </>
        ) : (
          <>
            <p className="done-note">这本词书暂时没有待学的词</p>
            <button className="primary xl" type="button" onClick={() => ui.go('books')}>
              换一本词书
            </button>
          </>
        )}
        {queue.length > 0 && home.remainingNew > 0 && home.newCount >= state.settings.dailyNew ? (
          <button className="text-btn" type="button" onClick={() => ui.startLearn(true)}>
            再学 5 个
          </button>
        ) : null}
      </section>

      <button className="book-row" type="button" onClick={() => ui.openBook(home.book.id)}>
        <Cover level={home.book.level} tint={home.book.tint} ink={home.book.ink} />
        <span className="book-row-copy">
          <strong>{home.book.name}</strong>
          <span>
            已学 {home.introduced}/{home.total}
            {home.mastered > 0 ? ` · 掌握 ${home.mastered}` : ''}
          </span>
          <span className="mini-track">
            <span style={{ width: `${home.total ? Math.round((home.introduced / home.total) * 100) : 0}%` }} />
          </span>
        </span>
        <span className="chevron" aria-hidden="true">
          ›
        </span>
      </button>

      <section className="stat-grid">
        <article>
          <b>{home.introduced}</b>
          <span>累计已学</span>
        </article>
        <article>
          <b>{home.mastered}</b>
          <span>已掌握</span>
        </article>
        <article>
          <b>{home.notebook}</b>
          <span>生词本</span>
        </article>
      </section>
    </div>
  );
}
