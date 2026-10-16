import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { CircleAlert, Info, X } from 'lucide-react';
import { finishModal, getModal, subscribeModal, type ModalRequest } from '../../services/notificationModal';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import './NotificationModal.css';

function ModalContent({ request }: { request: ModalRequest }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(request.defaultValue);
  const vi = document.documentElement.lang !== 'en';
  const cancel = () => finishModal(request.id, request.kind === 'confirmation' ? false : null);
  useModalBehavior(true, cancel);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.showModal();
    const initialFocus = request.kind === 'input' ? 'textarea' : request.kind === 'confirmation' ? '.notification-modal-secondary' : '.notification-modal-primary';
    dialog?.querySelector<HTMLElement>(initialFocus)?.focus();
    return () => { dialog?.close(); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  const title = request.kind === 'confirmation' ? (vi ? 'Xác nhận thao tác' : 'Confirm action') : (vi ? 'Thông báo' : 'Notification');
  return <dialog ref={dialogRef} className="notification-modal" aria-labelledby="notification-modal-title" aria-describedby="notification-modal-message" onCancel={event => { event.preventDefault(); cancel(); }}>
    <form onSubmit={event => { event.preventDefault(); finishModal(request.id, request.kind === 'input' ? value : true); }}>
      <header className="notification-modal-header"><span className="notification-modal-icon">{request.kind === 'confirmation' ? <CircleAlert size={24} /> : <Info size={24} />}</span><h2 id="notification-modal-title">{title}</h2><button type="button" className="notification-modal-close" onClick={cancel} aria-label={vi ? 'Đóng thông báo' : 'Close notification'}><X size={20} /></button></header>
      <p id="notification-modal-message">{request.message}</p>
      {request.kind === 'input' && <textarea autoFocus aria-label={request.message} rows={4} value={value} onChange={event => setValue(event.target.value)} />}
      <footer className="notification-modal-actions">
        {request.kind !== 'notice' && <button autoFocus={request.kind === 'confirmation'} type="button" className="notification-modal-secondary" onClick={cancel}>{vi ? 'Hủy' : 'Cancel'}</button>}
        <button autoFocus={request.kind === 'notice'} type="submit" className="notification-modal-primary">{request.kind === 'notice' ? (vi ? 'Đã hiểu' : 'Got it') : (vi ? 'Xác nhận' : 'Confirm')}</button>
      </footer>
    </form>
  </dialog>;
}

export function NotificationModal() {
  const request = useSyncExternalStore(subscribeModal, getModal);
  return request ? createPortal(<ModalContent key={request.id} request={request} />, document.body) : null;
}
