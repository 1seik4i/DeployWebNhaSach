import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, Download, X, Store, MapPin, BookOpen, Compass } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import './EntityQrButton.css';

export type QrEntity = 'booths' | 'venues' | 'locations' | 'books';

const ENTITY_CONFIG: Record<QrEntity, { label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  booths: { label: 'Gian hàng Đường Sách', icon: Store },
  venues: { label: 'Địa điểm & Cơ sở', icon: MapPin },
  locations: { label: 'Vị trí không gian', icon: Compass },
  books: { label: 'Ấn phẩm & Sách số', icon: BookOpen },
};

export function EntityQrButton({ kind, id, name, admin = false }: { kind: QrEntity; id: string; name: string; admin?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="entity-qr-button"
        title={`Mã QR: ${name}`}
        aria-label={`Mã QR: ${name}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <QrCode size={16} />
      </button>
      {open && createPortal(<QrModal kind={kind} id={id} name={name} admin={admin} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function QrModal({ kind, id, name, admin, onClose }: { kind: QrEntity; id: string; name: string; admin: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const url = new URL(`/thong-tin/${kind}/${encodeURIComponent(id)}`, import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin).href;
  const entityInfo = ENTITY_CONFIG[kind] || { label: 'Thông tin chi tiết', icon: QrCode };
  const EntityIcon = entityInfo.icon;

  useModalBehavior(true, onClose);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  const download = () => {
    if (!canvas.current) return;
    const link = document.createElement('a');
    link.download = `QR-${kind}-${id}.png`;
    link.href = canvas.current.toDataURL('image/png');
    link.click();
  };

  return (
    <dialog
      ref={dialog}
      className="entity-qr-modal"
      aria-labelledby="entity-qr-title"
      onClick={(e) => {
        if (e.target === dialog.current) {
          onClose();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="entity-qr-modal-inner">
        <header className="entity-qr-modal-header">
          <div className="entity-qr-badge">
            <EntityIcon size={14} />
            <span>{entityInfo.label}</span>
          </div>
          <button type="button" className="entity-qr-close" onClick={onClose} aria-label="Đóng mã QR">
            <X size={18} />
          </button>
        </header>

        <div className="entity-qr-body">
          <h3 id="entity-qr-title" className="entity-qr-name">{name}</h3>
          
          <div className="entity-qr-canvas-box">
            <QRCodeCanvas
              ref={canvas}
              value={url}
              size={512}
              marginSize={3}
              level="M"
              title={`Mã QR ${name}`}
            />
          </div>

          <p className="entity-qr-hint">
            Quét mã bằng camera điện thoại hoặc Zalo để xem thông tin chi tiết
          </p>
          <a href={url} target="_blank" rel="noreferrer">Xem thông tin chi tiết</a>
        </div>

        {admin && (
          <footer className="entity-qr-footer">
            <button type="button" className="entity-qr-btn entity-qr-btn-primary" onClick={download}>
              <Download size={16} />
              <span>Tải mã QR (PNG)</span>
            </button>
          </footer>
        )}
      </div>
    </dialog>
  );
}
