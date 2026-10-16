export type ModalKind = 'notice' | 'confirmation' | 'input';
export interface ModalRequest {
  id: number;
  kind: ModalKind;
  message: string;
  defaultValue: string;
  resolve: (value: string | boolean | null) => void;
}
let nextId = 0;
let queue: ModalRequest[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());
export const subscribeModal = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
export const getModal = () => queue[0] ?? null;
function enqueue(kind: ModalKind, message: string, defaultValue = '') {
  return new Promise<string | boolean | null>(resolve => {
    queue = [...queue, { id: ++nextId, kind, message, defaultValue, resolve }];
    emit();
  });
}
export function finishModal(id: number, value: string | boolean | null) {
  const current = queue[0];
  if (!current || current.id !== id) return;
  queue = queue.slice(1);
  current.resolve(value);
  emit();
}
export async function confirmModal(message: string): Promise<boolean> {
  return (await enqueue('confirmation', message)) === true;
}
export async function notifyModal(message: string): Promise<void> {
  await enqueue('notice', message);
}
export async function promptModal(message: string, defaultValue = ''): Promise<string | null> {
  const result = await enqueue('input', message, defaultValue);
  return typeof result === 'string' ? result : null;
}
