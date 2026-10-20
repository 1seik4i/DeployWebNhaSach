import { useState } from 'react';
import { X } from 'lucide-react';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import type { OrganizerEvent } from '../../types/organizer';
import type { Language } from '../../types';

export interface EventEditInput {
  title: string;
  startAt: string;
  endAt: string;
  description: string;
  venueId?: string;
}

const localDateTime = (value?: string) => value
  ? new Date(new Date(value).getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 16)
  : '';

export function AdminEventEditModal({ event, language, locations, onClose, onSave }: {
  event: OrganizerEvent;
  language: Language;
  locations: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: (data: EventEditInput) => Promise<void>;
}) {
  const vi = language === 'vi';
  const [title, setTitle] = useState(event.title);
  const [startAt, setStartAt] = useState(localDateTime(event.startAt));
  const [endAt, setEndAt] = useState(localDateTime(event.endAt));
  const [description, setDescription] = useState(event.description);
  const [venueId, setVenueId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useModalBehavior(true, onClose, saving);

  return <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => { if (!saving) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="admin-event-edit-title" className="modal-content" style={{ width: 'min(600px, calc(100vw - 32px))', maxHeight: '90dvh', overflowY: 'auto', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 id="admin-event-edit-title" style={{ margin: 0 }}>{vi ? 'Chỉnh sửa sự kiện' : 'Edit event'}</h2>
        <button type="button" className="adm-icon-btn" disabled={saving} aria-label={vi ? 'Đóng' : 'Close'} onClick={onClose}><X size={18} /></button>
      </div>
      <form onSubmit={async e => {
        e.preventDefault();
        if (saving) return;
        const start = new Date(`${startAt}:00+07:00`);
        const end = new Date(`${endAt}:00+07:00`);
        if (!title.trim() || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) {
          setError(vi ? 'Nhập tên sự kiện và thời gian kết thúc sau thời gian bắt đầu.' : 'Enter a title and an end time after the start time.');
          return;
        }
        setSaving(true);
        setError('');
        try {
          await onSave({ title: title.trim(), startAt: start.toISOString(), endAt: end.toISOString(), description, ...(venueId ? { venueId } : {}) });
        } catch (err) {
          setError(err instanceof Error ? err.message : (vi ? 'Không thể lưu sự kiện.' : 'Unable to save event.'));
        } finally { setSaving(false); }
      }}>
        <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: '1rem', minWidth: 0 }}>
          <label className="adm-form-label">{vi ? 'Tên sự kiện' : 'Event title'}<input className="adm-form-input" required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} /></label>
          <label className="adm-form-label">{vi ? 'Bắt đầu (giờ Việt Nam)' : 'Start (Vietnam time)'}<input className="adm-form-input" type="datetime-local" required value={startAt} onChange={e => setStartAt(e.target.value)} /></label>
          <label className="adm-form-label">{vi ? 'Kết thúc (giờ Việt Nam)' : 'End (Vietnam time)'}<input className="adm-form-input" type="datetime-local" required value={endAt} onChange={e => setEndAt(e.target.value)} /></label>
          <label className="adm-form-label">{vi ? 'Địa điểm' : 'Location'}<select className="adm-form-input" value={venueId} onChange={e => setVenueId(e.target.value)}>
            <option value="">{event.location || (vi ? 'Giữ địa điểm hiện tại' : 'Keep current location')}</option>
            {locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select></label>
          <label className="adm-form-label">{vi ? 'Mô tả' : 'Description'}<textarea className="adm-form-input" rows={5} maxLength={20000} value={description} onChange={e => setDescription(e.target.value)} /></label>
          {error && <p role="alert" style={{ color: '#B91C1C', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="adm-btn adm-btn-secondary" onClick={onClose}>{vi ? 'Hủy' : 'Cancel'}</button>
            <button type="submit" className="adm-btn adm-btn-primary">{saving ? (vi ? 'Đang lưu…' : 'Saving…') : (vi ? 'Lưu thay đổi' : 'Save changes')}</button>
          </div>
        </fieldset>
      </form>
    </section>
  </div>;
}
