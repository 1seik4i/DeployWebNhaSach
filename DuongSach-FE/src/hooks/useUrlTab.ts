import { useSearchParams } from 'react-router-dom';

/** Keep tab selection in browser history, including reload and Back/Forward. */
export function useUrlTab<const T extends readonly string[]>(tabs: T, fallback: T[number], key = 'tab') {
  const [params, setParams] = useSearchParams();
  const value = params.get(key);
  const active = (value !== null && tabs.includes(value) ? value : fallback) as T[number];
  const select = (tab: T[number]) => {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      next.set(key, tab);
      return next;
    });
  };
  return [active, select] as const;
}
