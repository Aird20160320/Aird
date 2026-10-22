import type { Card } from '../types';
import { DAY_MS, INTERVALS, clampStage, startOfDay } from './srs';

/** 记忆降到这个比例时安排下一次复习。 */
export const RETENTION_FLOOR = 0.8;

/** 还没稳住的词，按大约 20 分钟掉到复习线来画。 */
const SHORT_INTERVAL_DAYS = 20 / (24 * 60);

export const LADDER_DAYS = INTERVALS.slice(1);

export function retentionAt(elapsedDays: number, intervalDays: number): number {
  const elapsed = Math.max(0, elapsedDays);
  if (elapsed === 0) return 1;
  const span = Math.max(intervalDays, SHORT_INTERVAL_DAYS);
  return Math.exp((elapsed / span) * Math.log(RETENTION_FLOOR));
}

export function retentionPercent(value: number): number {
  return Math.round(Math.min(1, Math.max(0, value)) * 100);
}

export function reviewedAtOf(card: Card): number {
  if (!card.introduced) return 0;
  if (card.reviewedAt > 0) return card.reviewedAt;
  if (card.stage <= 0) return card.updatedAt || card.due;
  const interval = INTERVALS[clampStage(card.stage)] * DAY_MS;
  const fromDue = card.due - interval;
  if (card.updatedAt > 0 && Math.abs(card.updatedAt + interval - card.due) < 60 * 60 * 1000) return card.updatedAt;
  return Math.max(0, fromDue);
}

export function wordRetention(card: Card, now: number): number {
  const reviewed = reviewedAtOf(card);
  const intervalDays = Math.max(0, (card.due - reviewed) / DAY_MS);
  const elapsedDays = Math.max(0, (now - reviewed) / DAY_MS);
  return retentionAt(elapsedDays, intervalDays);
}

export type CurvePoint = { x: number; y: number };

export function ladderSegments(samples = 8): CurvePoint[][] {
  const count = LADDER_DAYS.length;
  return Array.from({ length: count }, (_, index) =>
    Array.from({ length: samples + 1 }, (_, step) => {
      const local = step / samples;
      return { x: (index + local) / count, y: retentionAt(local, 1) };
    }),
  );
}

export function placeOnLadder(card: Card, now: number): CurvePoint | null {
  if (!card.introduced) return null;
  const reviewed = reviewedAtOf(card);
  const intervalMs = card.due - reviewed;
  const elapsedDays = Math.max(0, (now - reviewed) / DAY_MS);
  const y = wordRetention(card, now);
  if (card.stage <= 0) return { x: 0.012, y };
  const index = Math.min(LADDER_DAYS.length - 1, card.stage - 1);
  const progress = intervalMs <= 0 ? 1 : Math.min(1, Math.max(0, (now - reviewed) / intervalMs));
  return { x: (index + progress) / LADDER_DAYS.length, y: Number.isFinite(elapsedDays) ? y : 1 };
}

export function wordCurve(card: Card, now: number, samples = 24): { series: CurvePoint[]; marker: CurvePoint; overdue: boolean } {
  const reviewed = reviewedAtOf(card);
  const intervalDays = Math.max(0, (card.due - reviewed) / DAY_MS);
  const elapsedDays = Math.max(0, (now - reviewed) / DAY_MS);
  const horizon = Math.max(intervalDays, elapsedDays, SHORT_INTERVAL_DAYS);
  const series = Array.from({ length: samples + 1 }, (_, index) => {
    const day = (horizon * index) / samples;
    return { x: index / samples, y: retentionAt(day, intervalDays) };
  });
  return {
    series,
    marker: { x: Math.min(1, elapsedDays / horizon), y: retentionAt(elapsedDays, intervalDays) },
    overdue: card.due <= now,
  };
}

export function idealCurve(samples = 24): CurvePoint[] {
  return Array.from({ length: samples + 1 }, (_, index) => {
    const local = index / samples;
    return { x: local, y: retentionAt(local, 1) };
  });
}

export function dueBuckets(cards: Card[], now: number, days: number): number[] {
  const today = startOfDay(now);
  const buckets = Array.from({ length: days }, () => 0);
  for (const card of cards) {
    if (!card.introduced) continue;
    const dueDay = startOfDay(card.due <= now ? now : card.due);
    const index = Math.round((dueDay - today) / DAY_MS);
    if (index >= 0 && index < days) buckets[index] += 1;
  }
  return buckets;
}
