import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Inbox, RefreshCw, Search, X } from 'lucide-react';
import { ListPagination, useListPagination } from '../ui/ListPagination';
import { apiClient } from '../../services/apiClient';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import type { Language } from '../../types';
import './AdminReviewLists.css';
import { createPortal } from 'react-dom';

type Suggestion = { id: string; fullName: string; phone: string; content: string; status: string; internalNote?: string; createdAt?: string };
const statuses: Record<string, [string, string]> = {
  new: ['Mới', 'New'], contacted: ['Đã liên hệ', 'Contacted'], approved: ['Chấp thuận', 'Approved'],
  rejected: ['Từ chối', 'Rejected'], closed: ['Đã đóng', 'Closed'],
};
const titleOf = (row: Suggestion) => row.content.split('\n')[0].replace(/^\[ĐỀ XUẤT SỰ KIỆN\]:\s*/i, '').trim();

export function AdminEventSuggestionsView({ language }: { language: Language }) {
  const vi = language === 'vi';
  const [rows, setRows] = useState<Suggestion[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [status, setStatus] = useState('new');
  const [note, setNote] = useState('');
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const version = useRef(0);
  useModalBehavior(Boolean(selected), () => setSelected(null), saving);

  const load = useCallback(async () => {
    const current = ++version.current;
    try {
      const data = await apiClient.get<Suggestion[]>('/admin/event-suggestions');
      if (current === version.current) { setRows(data); setError(''); }
    } catch (err) {
      if (current === version.current) setError(err instanceof Error ? err.message : 'Không thể tải đề xuất.');
    } finally { if (current === version.current) setLoading(false); }
  }, []);
  useEffect(() => {
    void load();
    const refresh = () => { if (document.visibilityState !== 'hidden') void load(); };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      ++version.current;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load]);

  const open = (row: Suggestion) => { setSelected(row); setStatus(row.status); setNote(row.internalNote || ''); setSaveError(''); setNotice(''); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || saving) return;
    setSaving(true); setSaveError('');
    try {
      const updated = await apiClient.patch<Suggestion>(`/admin/event-suggestions/${selected.id}`, { status, internalNote: note });
      ++version.current;
      setRows(items => items.map(row => row.id === updated.id ? updated : row));
      setSelected(null);
      setNotice(vi ? 'Đã lưu kết quả xử lý đề xuất.' : 'Suggestion updated.');
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Không thể lưu đề xuất.'); }
    finally { setSaving(false); }
  };
  const visible = rows.filter(row => (filter === 'all' || row.status === filter) &&
    `${row.fullName} ${row.phone} ${row.content}`.normalize('NFC').toLocaleLowerCase('vi-VN').includes(query.trim().normalize('NFC').toLocaleLowerCase('vi-VN')));
  const pagination = useListPagination(visible, `${filter}:${query}`, 8);
  const label = (value: string) => statuses[value]?.[vi ? 0 : 1] || value;
  const date = (value?: string) => value ? new Date(value).toLocaleDateString(vi ? 'vi-VN' : 'en-GB', { timeZone: 'Asia/Ho_Chi_Minh' }) : '—';

  return <div className="organizer-content activity-register admin-review-page">
    <header className="ar-header"><div><h1>{vi ? 'Đề xuất sự kiện' : 'Event suggestions'}</h1><p>{vi ? 'Tiếp nhận ý tưởng, theo dõi liên hệ và kết quả xử lý.' : 'Review ideas, follow up with contributors and record decisions.'}</p></div><button className="ar-button" disabled={loading || saving} onClick={() => void load()}><RefreshCw size={16}/>{vi ? 'Làm mới' : 'Refresh'}</button></header>
    <nav className="ar-tabs" aria-label={vi ? 'Trạng thái đề xuất' : 'Suggestion status'}>{['all', ...Object.keys(statuses)].map(value => <button key={value} className={filter === value ? 'is-active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value === 'all' ? (vi ? 'Tất cả' : 'All') : label(value)}<span>{value === 'all' ? rows.length : rows.filter(row => row.status === value).length}</span></button>)}</nav>
    <div className="ar-filters"><label className="ar-search"><Search size={17}/><input maxLength={200} aria-label={vi ? 'Tìm đề xuất' : 'Search suggestions'} placeholder={vi ? 'Tên sự kiện, người gửi, số điện thoại…' : 'Event, contributor or phone…'} value={query} onChange={e => setQuery(e.target.value)}/></label><select aria-label={vi ? 'Lọc trạng thái' : 'Filter status'} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">{vi ? 'Tất cả trạng thái' : 'All statuses'}</option>{Object.keys(statuses).map(value => <option key={value} value={value}>{label(value)}</option>)}</select></div>
    {error && <p className="ar-error" role="alert">{error}</p>}
    {notice && <p className="review-notice" role="status"><Check size={16}/>{notice}</p>}
    <section className="ar-register" aria-label={vi ? 'Danh sách đề xuất' : 'Suggestions'} aria-busy={loading}>
      <table className="review-table"><thead><tr className="ar-columns review-suggestions"><th>{vi ? 'Đề xuất' : 'Suggestion'}</th><th>{vi ? 'Người gửi' : 'Contributor'}</th><th>{vi ? 'Ngày gửi' : 'Submitted'}</th><th>{vi ? 'Trạng thái' : 'Status'}</th><th>{vi ? 'Thao tác' : 'Actions'}</th></tr></thead>
        <tbody>{pagination.items.map(row => <tr className="ar-row review-suggestions" key={row.id}>
          <td className="review-primary-cell"><button className="review-title" onClick={() => open(row)}>{titleOf(row)}</button>{row.internalNote && <span className="review-secondary review-preview">{row.internalNote}</span>}</td>
          <td><span className="ar-organizer">{row.fullName}</span><span className="review-secondary">{row.phone}</span></td>
          <td className="review-date">{date(row.createdAt)}</td>
          <td className="review-status-cell"><span className={`ar-status ${['new', 'contacted'].includes(row.status) ? 'is-pending' : row.status === 'approved' ? 'is-approved' : 'is-closed'}`}>{label(row.status)}</span></td>
          <td className="ar-actions"><button className="ar-button" onClick={() => open(row)}>{vi ? 'Xem chi tiết' : 'View details'}<ChevronRight size={15}/></button></td>
        </tr>)}</tbody>
      </table>
      {!visible.length && <div className="ar-empty"><Inbox size={28}/><h2>{loading ? (vi ? 'Đang tải đề xuất…' : 'Loading…') : (vi ? 'Không có đề xuất phù hợp' : 'No matching suggestions')}</h2><p>{vi ? 'Thử thay đổi trạng thái hoặc từ khóa tìm kiếm.' : 'Try another status or search term.'}</p></div>}
    </section>
    {visible.length > 0 && <ListPagination page={pagination.page} totalPages={pagination.totalPages} onChange={pagination.setPage} vi={vi}/>}
    {selected && createPortal(<div className="ar-overlay" onClick={() => { if (!saving) setSelected(null); }}><form className="ar-detail" role="dialog" aria-modal="true" aria-labelledby="es-dialog-title" onClick={e => e.stopPropagation()} onSubmit={save}>
      <header><span>{vi ? 'Chi tiết đề xuất' : 'Suggestion details'}</span><button className="ar-icon-button" type="button" aria-label={vi ? 'Đóng' : 'Close'} disabled={saving} onClick={() => setSelected(null)}><X size={21}/></button></header>
      <div className="ar-detail-body"><div className="ar-detail-title"><h2 id="es-dialog-title">{titleOf(selected)}</h2><span className={`ar-status ${selected.status === 'approved' ? 'is-approved' : ['new', 'contacted'].includes(selected.status) ? 'is-pending' : 'is-closed'}`}>{label(selected.status)}</span></div>
        <dl className="ar-facts"><div><dt>{vi ? 'Người liên hệ' : 'Contact'}</dt><dd>{selected.fullName}</dd></div><div><dt>{vi ? 'Số điện thoại' : 'Phone'}</dt><dd>{selected.phone}</dd></div><div><dt>{vi ? 'Ngày gửi' : 'Submitted'}</dt><dd>{date(selected.createdAt)}</dd></div></dl>
        <section className="ar-detail-section"><h3>{vi ? 'Nội dung đề xuất' : 'Proposal'}</h3><p>{selected.content}</p></section>
        <label className="review-field">{vi ? 'Trạng thái' : 'Status'}<select aria-label={vi ? 'Trạng thái' : 'Status'} value={status} disabled={saving} onChange={e => setStatus(e.target.value)}>{Object.keys(statuses).map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
        <label className="review-field">{vi ? 'Ghi chú xử lý' : 'Internal note'}<textarea value={note} maxLength={10000} rows={4} disabled={saving} onChange={e => setNote(e.target.value)} placeholder={vi ? 'Kết quả liên hệ hoặc lý do xử lý…' : 'Contact outcome or decision notes…'}/></label>
        <p className="review-hint">{vi ? 'Đây là ý tưởng từ khách tham quan. Chấp thuận không tự tạo sự kiện; nội dung, lịch và địa điểm cần được xác nhận trước.' : 'Visitor ideas require confirmation of the program, time and location before an event is created.'}</p>
        {saveError && <p className="ar-error" role="alert">{saveError}</p>}
      </div><footer><button type="button" className="ar-button" disabled={saving} onClick={() => setSelected(null)}>{vi ? 'Hủy' : 'Cancel'}</button><button className="ar-button ar-primary" disabled={saving}><Check size={16}/>{saving ? (vi ? 'Đang lưu…' : 'Saving…') : (vi ? 'Lưu xử lý' : 'Save changes')}</button></footer>
    </form></div>, document.body)}
  </div>;
}
