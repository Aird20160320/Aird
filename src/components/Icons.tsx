import type { ReactNode } from 'react';

type IconProps = { size?: number };

export function ShellMark({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <g fill="currentColor">
        <ellipse cx="32" cy="26" rx="7" ry="16" />
        <ellipse cx="21" cy="29" rx="6.5" ry="14" transform="rotate(-32 21 29)" />
        <ellipse cx="43" cy="29" rx="6.5" ry="14" transform="rotate(32 43 29)" />
        <ellipse cx="12.5" cy="34" rx="5.5" ry="11" transform="rotate(-58 12.5 34)" />
        <ellipse cx="51.5" cy="34" rx="5.5" ry="11" transform="rotate(58 51.5 34)" />
        <path d="M17 43c2.2 8 8 13 15 13s12.8-5 15-13c-5 3-10 4.5-15 4.5S22 46 17 43z" />
      </g>
    </svg>
  );
}

function Stroke({ children, size = 22 }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export function IconHome() {
  return (
    <Stroke>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </Stroke>
  );
}

export function IconBook() {
  return (
    <Stroke>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z" />
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3" />
      <path d="M9 8h7M9 12h7" />
    </Stroke>
  );
}

export function IconChart() {
  return (
    <Stroke>
      <path d="M4 19h16" />
      <path d="M7 16v-4M12 16V7M17 16v-6" />
    </Stroke>
  );
}

export function IconUser() {
  return (
    <Stroke>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19.2c1.4-3 3.8-4.5 7-4.5s5.6 1.5 7 4.5" />
    </Stroke>
  );
}

export function IconBack() {
  return (
    <Stroke size={20}>
      <path d="M15 5 8 12l7 7" />
    </Stroke>
  );
}

export function IconClose() {
  return (
    <Stroke size={20}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Stroke>
  );
}

export function IconVolume() {
  return (
    <Stroke size={18}>
      <path d="M4 10h3l4-3v10l-4-3H4z" />
      <path d="M16 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M18.2 7.2a6.5 6.5 0 0 1 0 9.6" />
    </Stroke>
  );
}

export function IconBookmark({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.2L6 20V5.5a1 1 0 0 1 1-1z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
