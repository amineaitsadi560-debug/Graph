import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
type T = { id: number; msg: string; kind: 'ok' | 'bad' };
const Ctx = createContext<(msg: string, kind?: 'ok' | 'bad') => void>(() => {});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<T[]>([]);
  const push = useCallback((msg: string, kind: 'ok' | 'bad' = 'ok') => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, msg, kind }]);
    setTimeout(() => setList((l) => l.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toast-wrap" aria-live="polite">{list.map((x) => <div key={x.id} className={`toast ${x.kind}`} role="status">{x.msg}</div>)}</div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);
