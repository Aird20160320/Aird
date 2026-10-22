import { useEffect, useState } from 'react';
import { DAILY_CHOICES, DAILY_MAX, DAILY_MIN, isDailyNew } from '../types';
import { useStore } from '../store';
import { useUi } from '../ui';

export function DailyGoal({ hint }: { hint?: string }) {
  const { state, dispatch } = useStore();
  const ui = useUi();
  const current = state.settings.dailyNew;
  const [draft, setDraft] = useState(String(current));

  useEffect(() => {
    setDraft(String(current));
  }, [current]);

  function apply(count: number) {
    if (!isDailyNew(count)) {
      setDraft(String(current));
      ui.toast(`每天可以学 ${DAILY_MIN} 到 ${DAILY_MAX} 个新词`);
      return;
    }
    setDraft(String(count));
    if (count === current) return;
    dispatch({ type: 'set-daily', dailyNew: count, now: Date.now() });
    ui.toast(`每天新学 ${count} 个`);
  }

  return (
    <div className="daily-goal">
      <div className="meter-top">
        <span>每天新词</span>
        <strong>{current} 个</strong>
      </div>
      <div className="choices" role="group" aria-label="每天新词数量">
        {DAILY_CHOICES.map((count) => (
          <button
            key={count}
            type="button"
            className={current === count ? 'chip on' : 'chip'}
            aria-pressed={current === count}
            onClick={() => apply(count)}
          >
            {count}
          </button>
        ))}
        <label className="daily-custom">
          <span className="sr">自定义数量</span>
          <input
            value={draft}
            inputMode="numeric"
            maxLength={2}
            aria-label={`自定义每天新词，${DAILY_MIN} 到 ${DAILY_MAX}`}
            onChange={(event) => setDraft(event.target.value.replace(/\D/g, '').slice(0, 2))}
            onBlur={() => apply(Number(draft))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
          />
        </label>
      </div>
      {hint ? <p className="meter-hint">{hint}</p> : null}
    </div>
  );
}
