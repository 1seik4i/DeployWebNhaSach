import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Inbox, MessageSquare, RefreshCw, Search, X } from 'lucide-react';
import { ListPagination, useListPagination } from '../ui/ListPagination';
import { apiClient } from '../../services/apiClient';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import type { Language } from '../../types';
import './AdminEventSuggestionsView.css';

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
    `${row.fullName} ${row.phone} ${row.content}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')));
  const pagination = useListPagination(visible, `${filter}:${query}`, 8);
  const label = (value: string) => statuses[value]?.[vi ? 0 : 1] || value;
  const date = (value?: string) => value ? new Date(value).toLocaleDateString(vi ? 'vi-VN' : 'en-GB') : '—';
  const summaries = [
    { id: 'all', name: vi ? 'Tổng đề xuất' : 'All suggestions', count: rows.length, icon: Inbox },
    { id: 'new', name: vi ? 'Chờ tiếp nhận' : 'Awaiting review', count: rows.filter(row => row.status === 'new').length, icon: MessageSquare },
    { id: 'approved', name: vi ? 'Đã chấp thuận' : 'Approved', count: rows.filter(row => row.status === 'approved').length, icon: Check },
  ];

  return <div className="event-suggestions">
    <header className="es-heading">
      <div><h1>{vi ? 'Đề xuất sự kiện' : 'Event suggestions'}</h1>
        <p>{vi ? 'Tiếp nhận ý tưởng từ khách tham quan, liên hệ và theo dõi kết quả xử lý.' : 'Review visitor ideas, contact contributors and track progress.'}</p>
      </div>
      <button className="adm-btn adm-btn-secondary" onClick={() => void load()}><RefreshCw size={16}/>{vi ? 'Làm mới' : 'Refresh'}</button>
    </header>
    <div className="es-summary">{summaries.map(item => <button key={item.id} className={`es-metric ${filter === item.id ? 'is-active' : ''}`} onClick={() => setFilter(item.id)}>
      <span className={`es-metric-icon is-${item.id}`}><item.icon size={21}/></span>
      <span><span className="es-metric-label">{item.name}</span><strong>{item.count}</strong></span>
    </button>)}</div>
    {error && <p className="es-error" role="alert">{error}</p>}
    {notice && <p className="es-notice" role="status">{notice}</p>}
    <section className="es-list" aria-label={vi ? 'Danh sách đề xuất' : 'Suggestions'}>
      <div className="es-toolbar">
        <label className="es-search"><Search size={17}/><input aria-label={vi ? 'Tìm đề xuất' : 'Search suggestions'} placeholder={vi ? 'Tìm tên sự kiện, người gửi, số điện thoại…' : 'Search event, contributor or phone…'} value={query} onChange={e => setQuery(e.target.value)}/></label>
        <select aria-label={vi ? 'Lọc trạng thái' : 'Filter status'} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">{vi ? 'Tất cả trạng thái' : 'All statuses'}</option>
          {Object.keys(statuses).map(value => <option key={value} value={value}>{label(value)}</option>)}
        </select>
      </div>
      <div className="es-table-scroll"><table>
        <thead><tr><th>{vi ? 'Đề xuất' : 'Suggestion'}</th><th>{vi ? 'Người gửi' : 'Contributor'}</th><th>{vi ? 'Ngày gửi' : 'Submitted'}</th><th>{vi ? 'Trạng thái' : 'Status'}</th><th>{vi ? 'Thao tác' : 'Action'}</th></tr></thead>
        <tbody>{pagination.items.map(row => <tr key={row.id}>
          <td><strong className="es-title">{titleOf(row)}</strong><span className="es-preview">{row.internalNote || (vi ? 'Chưa có ghi chú xử lý' : 'No internal note')}</span></td>
          <td><span className="es-person">{row.fullName}</span><span className="es-preview">{row.phone}</span></td>
          <td className="es-date">{date(row.createdAt)}</td>
          <td><span className={`es-badge is-${row.status}`}>{label(row.status)}</span></td>
          <td><button className="es-open" onClick={() => open(row)}>{vi ? 'Xem chi tiết' : 'View details'}<ChevronRight size={15}/></button></td>
        </tr>)}</tbody>
      </table></div>
      {!visible.length && <div className="es-empty"><Inbox size={32}/><strong>{loading ? (vi ? 'Đang tải đề xuất…' : 'Loading…') : (vi ? 'Không có đề xuất phù hợp' : 'No matching suggestions')}</strong><p>{vi ? 'Đề xuất từ trang Liên hệ sẽ xuất hiện tại đây. Thử thay đổi bộ lọc nếu cần.' : 'Suggestions from the Contact page appear here. Try adjusting the filters.'}</p></div>}
      {visible.length > 0 && (
        <ListPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onChange={pagination.setPage}
          vi={vi}
        />
      )}
    </section>
    {selected && <div className="es-overlay" onClick={() => { if (!saving) setSelected(null); }}>
      <form className="es-dialog" role="dialog" aria-modal="true" aria-labelledby="es-dialog-title" onClick={e => e.stopPropagation()} onSubmit={save}>
        <header><div><span className="es-eyebrow">{vi ? 'CHI TIẾT ĐỀ XUẤT' : 'SUGGESTION DETAILS'}</span><h2 id="es-dialog-title">{titleOf(selected)}</h2></div><button type="button" aria-label={vi ? 'Đóng' : 'Close'} disabled={saving} onClick={() => setSelected(null)}><X size={21}/></button></header>
        <div className="es-dialog-body">
          <div className="es-contact"><div><small>{vi ? 'Người liên hệ' : 'Contact'}</small><strong>{selected.fullName}</strong></div><div><small>{vi ? 'Số điện thoại' : 'Phone'}</small><strong>{selected.phone}</strong></div><div><small>{vi ? 'Ngày gửi' : 'Submitted'}</small><strong>{date(selected.createdAt)}</strong></div></div>
          <h3>{vi ? 'Nội dung đề xuất' : 'Proposal'}</h3><p className="es-content">{selected.content}</p>
          <label className="es-field">{vi ? 'Trạng thái' : 'Status'}<select value={status} disabled={saving} onChange={e => setStatus(e.target.value)}>{Object.keys(statuses).map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
          <label className="es-field">{vi ? 'Ghi chú xử lý' : 'Internal note'}<textarea value={note} maxLength={10000} rows={4} disabled={saving} onChange={e => setNote(e.target.value)} placeholder={vi ? 'Ghi lại kết quả liên hệ hoặc lý do xử lý…' : 'Contact outcome or decision notes…'}/></label>
          <p className="es-hint">{vi ? 'Chấp thuận đề xuất không tự tạo hay công bố sự kiện. Sau khi thống nhất nội dung, tạo sự kiện tại Lịch & Sự kiện.' : 'Approval does not create or publish an event. Create it in Events Management after confirming the details.'}</p>
          {saveError && <p className="es-error" role="alert">{saveError}</p>}
        </div>
        <footer><button type="button" className="adm-btn adm-btn-secondary" disabled={saving} onClick={() => setSelected(null)}>{vi ? 'Hủy' : 'Cancel'}</button><button className="adm-btn adm-btn-primary" disabled={saving}><Check size={16}/>{saving ? (vi ? 'Đang lưu…' : 'Saving…') : (vi ? 'Lưu xử lý' : 'Save changes')}</button></footer>
      </form>
    </div>}
  </div>;
}
