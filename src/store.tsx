import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { reducer, type Action } from './lib/reducer';
import { loadState, saveState } from './lib/storage';
import type { State } from './types';

const StoreContext = createContext<{ state: State; dispatch: (action: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadState());
  useEffect(() => {
    saveState(state);
  }, [state]);
  useEffect(() => {
    dispatch({ type: 'tick', now: Date.now() });
  }, []);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('学习状态还没有准备好');
  return context;
}
