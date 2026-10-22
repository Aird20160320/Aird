import type { Card, Rating } from '../types';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** 阶段 1 起对应的间隔天数。阶段 0 表示还没稳住。 */
export const INTERVALS = [0, 1, 2, 4, 7, 15, 30, 60, 120] as const;
export const MAX_STAGE = INTERVALS.length - 1;

export function emptyCard(): Card {
  return {
    introduced: false,
    stage: 0,
    due: 0,
    notebook: false,
    lapses: 0,
    reviews: 0,
    correct: 0,
    updatedAt: 0,
    reviewedAt: 0,
  };
}

export function clampStage(stage: number): number {
  if (!Number.isFinite(stage)) return 0;
  return Math.min(MAX_STAGE, Math.max(0, Math.round(stage)));
}

export function isDue(card: Card | undefined, now: number): boolean {
  return !!card?.introduced && card.due <= now;
}

export function applyRating(card: Card, rating: Rating, now: number): Card {
  const stageNow = clampStage(card.stage);
  const next: Card = {
    ...card,
    introduced: true,
    stage: stageNow,
    reviews: card.reviews + 1,
    updatedAt: now,
    reviewedAt: now,
    correct: rating === 'again' ? card.correct : card.correct + 1,
    lapses: rating === 'again' ? card.lapses + 1 : card.lapses,
  };

  if (rating === 'again') return { ...next, stage: 0, due: now };

  if (rating === 'hard') {
    if (stageNow <= 0) return { ...next, stage: 1, due: now + DAY_MS };
    const days = Math.max(1, Math.round(INTERVALS[stageNow] / 2));
    return { ...next, stage: stageNow, due: now + days * DAY_MS };
  }

  if (rating === 'good') {
    const stage = stageNow === 0 ? 2 : Math.min(MAX_STAGE, stageNow + 1);
    return { ...next, stage, due: now + INTERVALS[stage] * DAY_MS };
  }

  const stage = stageNow === 0 ? 3 : Math.min(MAX_STAGE, stageNow + 2);
  return { ...next, stage, due: now + INTERVALS[stage] * DAY_MS };
}

export function formatDelay(ms: number): string {
  if (ms < 1000) return '马上';
  const minutes = Math.round(ms / 60000);
  if (minutes < 90) return `${Math.max(1, minutes)} 分钟`;
  const days = ms / DAY_MS;
  if (days < 45) return `${Math.max(1, Math.round(days))} 天`;
  return `${Math.max(1, Math.round(days / 30))} 个月`;
}

export function previewDelay(stage: number, rating: Rating): string {
  const card = applyRating({ ...emptyCard(), stage: clampStage(stage), introduced: true }, rating, 0);
  return formatDelay(card.due);
}

export function stageLabel(card: Card | undefined): string {
  if (!card?.introduced) return '未学';
  if (card.stage <= 1) return '初识';
  if (card.stage <= 3) return '学习中';
  if (card.stage <= 5) return '熟悉';
  return '已掌握';
}

export function isMastered(card: Card | undefined): boolean {
  return !!card?.introduced && card.stage >= 6;
}

export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function prevDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return dayKey(date);
}

export function computeStreak(checkedDates: string[], today: string): number {
  const set = new Set(checkedDates);
  let cursor = set.has(today) ? today : prevDay(today);
  let count = 0;
  while (set.has(cursor)) {
    count += 1;
    cursor = prevDay(cursor);
  }
  return count;
}

export function reviewMeter(reviewTarget: number, reviewCount: number, dueNow: number): { value: number; total: number } {
  return {
    value: reviewCount,
    total: Math.max(reviewTarget, reviewCount + Math.max(0, dueNow)),
  };
}

export function isBookGoalMet(
  log: { newCount: number; reviewCount: number; reviewTarget: number },
  dailyNew: number,
  remainingNew: number,
): boolean {
  if (log.newCount + log.reviewCount <= 0) return false;
  const newOk = log.newCount >= dailyNew || remainingNew === 0;
  const reviewOk = log.reviewCount >= log.reviewTarget;
  return newOk && reviewOk;
}

export function startOfDay(ms: number): number {
  const date = new Date(ms);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatReviewDay(due: number, now = Date.now()): string {
  if (due <= now) return '待复习';
  const days = Math.round((due - now) / DAY_MS);
  if (days <= 0) return '今天稍后';
  if (days === 1) return '明天';
  if (days < 30) return `${days} 天后`;
  const date = new Date(due);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatChineseDate(date = new Date()): string {
  const weeks = ['日', '一', '二', '三', '四', '五', '六'];
  return `${date.getMonth() + 1}月${date.getDate()}日 星期${weeks[date.getDay()]}`;
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return '夜深了';
  if (hour < 11) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}
