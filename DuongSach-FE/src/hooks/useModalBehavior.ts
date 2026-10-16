import { useEffect, useRef } from 'react';
import './modalBehavior.css';

// Each modal owns a lock; closing a child must not unlock its parent.
const openModals: symbol[] = [];

export function useModalBehavior(open: boolean, onClose: () => void, busy = false) {
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    if (!open) return;
    const id = Symbol('modal');
    openModals.push(id);
    document.documentElement.classList.add('modal-scroll-locked');
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || openModals.at(-1) !== id) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!busyRef.current) closeRef.current();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      const index = openModals.indexOf(id);
      if (index !== -1) openModals.splice(index, 1);
      if (!openModals.length) document.documentElement.classList.remove('modal-scroll-locked');
    };
  }, [open]);
}
