import type { Card } from '../types';
import {
  LADDER_DAYS,
  dueBuckets,
  idealCurve,
  ladderSegments,
  placeOnLadder,
  retentionPercent,
  wordCurve,
  wordRetention,
  type CurvePoint,
} from '../lib/memory';
import { DAY_MS, formatReviewDay, isDue, startOfDay } from '../lib/srs';
import { useStore } from '../store';

const PLOT = { left: 36, top: 12, width: 300, height: 104 };

function axisMin(points: CurvePoint[]): number {
  const low = points.reduce((min, point) => Math.min(min, point.y), 0.8);
  if (low >= 0.78) return 0.6;
  if (low >= 0.4) return Math.max(0, Math.floor((low - 0.08) * 5) / 5);
  return 0;
}

function mapPoint(point: CurvePoint, yMin: number, box = PLOT): [number, number] {
  const y = Math.max(yMin, Math.min(1, point.y));
  const t = (y - yMin) / (1 - yMin);
  return [box.left + point.x * box.width, box.top + (1 - t) * box.height];
}

function linePath(points: CurvePoint[], yMin: number, box = PLOT): string {
  return points
    .map((point, index) => {
      const [x, y] = mapPoint(point, yMin, box);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function areaPath(points: CurvePoint[], yMin: number, box = PLOT): string {
  if (points.length === 0) return '';
  const base = box.top + box.height;
  const [x0] = mapPoint(points[0], yMin, box);
  const [x1] = mapPoint(points[points.length - 1], yMin, box);
  return `${linePath(points, yMin, box)} L${x1.toFixed(1)} ${base} L${x0.toFixed(1)} ${base} Z`;
}

function Chart({
  series,
  dots = [],
  marker,
  label,
  height = 132,
}: {
  series: CurvePoint[][];
  dots?: CurvePoint[];
  marker?: CurvePoint;
  label: string;
  height?: number;
}) {
  const yMin = axisMin([...series.flat(), ...dots, ...(marker ? [marker] : [])]);
  const guideY = mapPoint({ x: 0, y: 0.8 }, yMin)[1];
  const bottom = PLOT.top + PLOT.height;
  const floor = yMin <= 0 ? '0' : `${Math.round(yMin * 100)}%`;
  return (
    <svg className="memory-svg" viewBox={`0 0 344 ${height}`} role="img" aria-label={label}>
      <text x="32" y="16" textAnchor="end">
        100%
      </text>
      <text x="32" y={guideY + 4} textAnchor="end">
        80%
      </text>
      <text x="32" y={bottom + 4} textAnchor="end">
        {floor}
      </text>
      <line x1={PLOT.left} x2={PLOT.left + PLOT.width} y1={guideY} y2={guideY} className="memory-guide" />
      {series.map((points, index) => (
        <g key={index}>
          <path d={areaPath(points, yMin)} className="memory-area" />
          <path d={linePath(points, yMin)} className="memory-line" />
        </g>
      ))}
      {dots.map((dot, index) => {
        const [x, y] = mapPoint(dot, yMin);
        return <circle key={index} cx={x} cy={y} r="4" className={dot.y < 0.8 ? 'memory-dot late' : 'memory-dot'} />;
      })}
      {marker ? <circle cx={mapPoint(marker, yMin)[0]} cy={mapPoint(marker, yMin)[1]} r="5" className="memory-marker" /> : null}
    </svg>
  );
}

export function MemoryOverview() {
  const { state } = useStore();
  const now = Date.now();
  const cards = Object.values(state.cards).filter((card) => card.introduced);
  const average = cards.length === 0 ? null : retentionPercent(cards.reduce((sum, card) => sum + wordRetention(card, now), 0) / cards.length);
  const due = cards.filter((card) => isDue(card, now)).length;
  const steady = cards.length - due;
  const buckets = dueBuckets(cards, now, 7);
  const peak = Math.max(1, ...buckets);
  const dots = cards.map((card) => placeOnLadder(card, now)).filter((dot): dot is CurvePoint => !!dot);
  const label =
    average === null
      ? '记忆曲线。刚记住接近 100%，降到 80% 左右会再复习。还没有学过的词。'
      : `记忆曲线。平均还记得 ${average}%。该复习 ${due} 个，还稳的 ${steady} 个。`;

  return (
    <section className="panel">
      <h2>记忆曲线</h2>
      <p className="memory-lead">
        {average === null
          ? '刚记住时接近 100%。降到 80% 左右，这个词会再出现。'
          : `正在记的词，平均还记得 ${average}%。降到 80% 左右会再出现。`}
      </p>
      <Chart series={ladderSegments()} dots={dots} label={label} />
      <div className="memory-axis" aria-hidden="true">
        {LADDER_DAYS.map((days) => (
          <span key={days}>{days}</span>
        ))}
      </div>
      <p className="meter-hint">横轴是每档复习的间隔天数。圆点是正在记的词，掉到虚线以下就该复习了。</p>
      <div className="memory-counts">
        <div>
          <b>{due}</b>
          <span>该复习</span>
        </div>
        <div>
          <b>{steady}</b>
          <span>还稳</span>
        </div>
        <div>
          <b>{average === null ? '—' : `${average}%`}</b>
          <span>平均记得</span>
        </div>
      </div>
      <div className="forecast">
        <h3>接下来 7 天</h3>
        <div className="bars forecast-bars">
          {buckets.map((count, index) => (
            <div className="bar-col" key={index}>
              <div className="bar-track">
                <div style={{ height: `${Math.round((count / peak) * 100)}%` }} />
              </div>
              <span>{bucketLabel(index, now)}</span>
            </div>
          ))}
        </div>
        <p className="meter-hint">{buckets.some((count) => count > 0) ? '柱子是当天会到期的词，包含今天还没复习的。' : '这 7 天还没有排上的复习。'}</p>
      </div>
    </section>
  );
}

function bucketLabel(index: number, now: number): string {
  if (index === 0) return '今';
  if (index === 1) return '明';
  return String(new Date(startOfDay(now) + index * DAY_MS).getDate());
}

export function WordMemory({ card }: { card: Card | undefined }) {
  const now = Date.now();
  if (!card?.introduced) {
    return (
      <section className="memory-block">
        <h3>记忆曲线</h3>
        <Chart series={[idealCurve()]} height={132} label="还没学过。学过之后，记忆会从高处下降，到 80% 左右再次复习。" />
        <div className="memory-x" aria-hidden="true">
          <span>刚复习</span>
          <span>该复习</span>
        </div>
        <p>学过一次之后，会从接近 100% 往下降。降到 80% 左右时再见面。</p>
      </section>
    );
  }

  const curve = wordCurve(card, now);
  const percent = retentionPercent(curve.marker.y);
  const detail = curve.overdue ? '已经到了该复习的时候。' : `下次见面：${formatReviewDay(card.due)}。`;
  return (
    <section className="memory-block">
      <h3>记忆曲线</h3>
      <Chart series={[curve.series]} marker={curve.marker} height={132} label={`这个词现在大约记得 ${percent}%。${detail}`} />
      <div className="memory-x" aria-hidden="true">
        <span>刚复习</span>
        <span>{curve.overdue ? '现在' : '下次复习'}</span>
      </div>
      <p>
        现在大约记得 <b>{percent}%</b>。{detail}
      </p>
    </section>
  );
}
