import { createContext, useContext, type ReactNode } from 'react';

export type View = 'home' | 'learn' | 'books' | 'book' | 'stats' | 'me' | 'notebook';

export type UiValue = {
  view: View;
  bookFocus: string;
  extra: boolean;
  openWord: (id: string) => void;
  go: (view: View) => void;
  openBook: (id: string) => void;
  startLearn: (extra?: boolean) => void;
  toast: (message: string) => void;
};

const UiContext = createContext<UiValue | null>(null);

export function UiProvider({ value, children }: { value: UiValue; children: ReactNode }) {
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const value = useContext(UiContext);
  if (!value) throw new Error('界面状态还没有准备好');
  return value;
}
