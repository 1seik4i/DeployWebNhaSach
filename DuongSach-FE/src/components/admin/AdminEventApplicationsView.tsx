import { useModalBehavior } from '../../hooks/useModalBehavior';
import { ListPagination, useListPagination } from '../ui/ListPagination';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  RefreshCw,
  Search,
  X,
  Inbox
} from 'lucide-react';
import { organizerApi, type OrganizerPartnerApplication } from '../../services/organizerApi';
import type { Language } from '../../types';
import './AdminReviewLists.css';
import { createPortal } from 'react-dom';

const statusNames: Record<string, [string, string]> = {
  submitted: ['Chờ duyệt', 'Pending'],
  need_changes: ['Cần bổ sung', 'Needs changes'],
  approved: ['Đã duyệt', 'Approved'],
  rejected: ['Đã từ chối', 'Rejected'],
  draft: ['Bản nháp', 'Draft'],
  cancelled: ['Đã hủy', 'Cancelled'],
};

export function AdminEventApplicationsView({ language }: { language: Language }) {
  const vi = language === 'vi';
  const [rows, setRows] = useState<OrganizerPartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [eventId, setEventId] = useState('all');
  const [review, setReview] = useState<{ row: OrganizerPartnerApplication; approve: boolean } | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<OrganizerPartnerApplication | null>(null);

  useModalBehavior(Boolean(review || detail), () => { setReview(null); setDetail(null); }, saving);
  const requestVersion = useRef(0);

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      const data = await organizerApi.getPartnerApplications();
      if (version !== requestVersion.current) return;
      setRows(data);
      setError('');
    } catch (cause) {
      if (version === requestVersion.current) setError(cause instanceof Error ? cause.message : 'Không tải được đơn đăng ký.');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const reload = () => void refresh();
    window.addEventListener('focus', reload);
    window.addEventListener('duongsach:data-changed', reload);
    return () => {
      requestVersion.current++;
      window.removeEventListener('focus', reload);
      window.removeEventListener('duongsach:data-changed', reload);
    };
  }, [refresh]);


  const pending = (row: OrganizerPartnerApplication) => ['submitted', 'need_changes'].includes(row.status);
  const events = [...new Map(rows.map(row => [row.eventId, row.eventTitle || row.eventId])).entries()];
  const visible = rows.filter(row =>
    (eventId === 'all' || row.eventId === eventId) &&
    (status === 'all' || (status === 'pending' ? pending(row) : row.status === status)) &&
    [row.orgName, row.rep, row.email, row.phone, row.eventTitle].some(value => value?.normalize('NFC').toLocaleLowerCase('vi-VN').includes(query.trim().normalize('NFC').toLocaleLowerCase('vi-VN')))
  );

  const pagination = useListPagination(visible, `${eventId}:${status}:${query}`, 8);

  const pendingCount = rows.filter(r => pending(r)).length;
  const approvedCount = rows.filter(r => r.status === 'approved').length;
  const rejectedCount = rows.filter(r => r.status === 'rejected').length;

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!review || saving || (!review.approve && !note.trim())) return;
    setSaving(true);
    setError('');
    try {
      if (review.approve) await organizerApi.approvePartnerApplication(review.row.id);
      else await organizerApi.rejectPartnerApplication(review.row.id, note.trim());
      setNotice(vi ? 'Đã lưu kết quả xét duyệt và gửi thông báo cho đối tác.' : 'Review saved and the partner notified.');
      setReview(null);
      setNote('');
      await refresh();
    } catch (cause) {
      await refresh();
      setError(cause instanceof Error ? cause.message : 'Không thể xét duyệt đơn.');
    } finally {
      setSaving(false);
    }
  };

  const beginReview = (row: OrganizerPartnerApplication, approve: boolean) => {
    setDetail(null); setNote(''); setError(''); setNotice(''); setReview({ row, approve });
  };
  const selectedRow = review?.row || detail;
  const label = (value: string) => statusNames[value]?.[vi ? 0 : 1] || value;
  const badge = (value: string) => <span className={`ar-status ${['submitted', 'need_changes', 'draft'].includes(value) ? 'is-pending' : value === 'approved' ? 'is-approved' : 'is-closed'}`}>{label(value)}</span>;
  const tabs = [
    { id: 'all', label: vi ? 'Tất cả' : 'All', count: rows.length },
    { id: 'pending', label: vi ? 'Chờ duyệt' : 'Pending', count: pendingCount },
    { id: 'approved', label: vi ? 'Đã duyệt' : 'Approved', count: approvedCount },
    { id: 'rejected', label: vi ? 'Đã từ chối' : 'Rejected', count: rejectedCount },
  ];
  return <div className="organizer-content activity-register admin-review-page">
    <header className="ar-header"><div><h1>{vi ? 'Đơn tham gia sự kiện' : 'Event applications'}</h1><p>{vi ? 'Xét duyệt hồ sơ tham gia, theo dõi sự kiện và đơn vị đăng ký.' : 'Review participation applications and track events and partner organizations.'}</p></div><button className="ar-button" disabled={loading || saving} onClick={() => void refresh()}><RefreshCw size={16}/>{vi ? 'Làm mới' : 'Refresh'}</button></header>
    <nav className="ar-tabs" aria-label={vi ? 'Trạng thái đơn tham gia' : 'Application status'}>{tabs.map(tab => <button key={tab.id} className={status === tab.id ? 'is-active' : ''} aria-pressed={status === tab.id} onClick={() => setStatus(tab.id)}>{tab.label}<span>{tab.count}</span></button>)}</nav>
    <div className="ar-filters"><label className="ar-search"><Search size={17}/><input maxLength={200} aria-label={vi ? 'Tìm đơn đăng ký' : 'Search applications'} placeholder={vi ? 'Tên đơn vị, người đại diện, sự kiện…' : 'Partner, representative or event…'} value={query} onChange={e => setQuery(e.target.value)}/></label><select aria-label={vi ? 'Lọc sự kiện' : 'Filter event'} value={eventId} onChange={e => setEventId(e.target.value)}><option value="all">{vi ? 'Tất cả sự kiện' : 'All events'}</option>{events.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select><select aria-label={vi ? 'Lọc trạng thái' : 'Filter status'} value={status} onChange={e => setStatus(e.target.value)}><option value="all">{vi ? 'Tất cả trạng thái' : 'All statuses'}</option><option value="pending">{vi ? 'Chờ xét duyệt' : 'Pending review'}</option>{Object.entries(statusNames).map(([key, names]) => <option key={key} value={key}>{names[vi ? 0 : 1]}</option>)}</select></div>
    {notice && <p className="review-notice" role="status"><Check size={16}/>{notice}<button aria-label={vi ? 'Đóng thông báo' : 'Dismiss notice'} onClick={() => setNotice('')}><X size={15}/></button></p>}
    {error && !selectedRow && <p className="ar-error" role="alert">{error}</p>}
    <section className="ar-register" aria-label={vi ? 'Danh sách đơn tham gia' : 'Event applications'} aria-busy={loading}>
      <table className="review-table"><thead><tr className="ar-columns review-applications"><th>{vi ? 'Đơn vị đăng ký' : 'Partner'}</th><th>{vi ? 'Sự kiện' : 'Event'}</th><th>{vi ? 'Ngày nộp' : 'Submitted'}</th><th>{vi ? 'Trạng thái' : 'Status'}</th><th>{vi ? 'Thao tác' : 'Actions'}</th></tr></thead><tbody>
        {pagination.items.map(row => <tr className="ar-row review-applications" key={row.id}>
          <td className="review-primary-cell"><button className="review-title" onClick={() => { setError(''); setDetail(row); }}>{row.orgName}</button><span className="review-secondary">{row.rep || '—'}</span>{row.phone && <span className="review-secondary">{row.phone}</span>}</td>
          <td><span className="ar-organizer">{row.eventTitle || row.eventId}</span><span className="review-secondary review-role">{row.participationRole === 'organizer' ? (vi ? 'Đối tác tổ chức' : 'Organizing partner') : (vi ? 'Đối tác tham gia' : 'Participating partner')}</span></td>
          <td className="review-date">{row.date || '—'}</td><td className="review-status-cell">{badge(row.status)}</td>
          <td className="ar-actions"><button className="ar-button" disabled={saving} onClick={() => { setError(''); setDetail(row); }}>{vi ? 'Chi tiết' : 'Details'}</button>{pending(row) && <><button className="ar-button ar-primary" disabled={saving} onClick={() => beginReview(row, true)}><Check size={15}/>{vi ? 'Duyệt đơn' : 'Approve'}</button><button className="ar-icon-button ar-danger" disabled={saving} aria-label={`${vi ? 'Từ chối' : 'Reject'} ${row.orgName}`} title={vi ? 'Từ chối' : 'Reject'} onClick={() => beginReview(row, false)}><X size={16}/></button></>}</td>
        </tr>)}
      </tbody></table>
      {!visible.length && <div className="ar-empty"><Inbox size={28}/><h2>{loading ? (vi ? 'Đang tải hồ sơ…' : 'Loading applications…') : (vi ? 'Không có đơn phù hợp' : 'No matching applications')}</h2><p>{error ? (vi ? 'Không thể tải danh sách. Chọn Làm mới để thử lại.' : 'Unable to load applications. Refresh to retry.') : (vi ? 'Thử thay đổi trạng thái, sự kiện hoặc từ khóa tìm kiếm.' : 'Try another status, event or search term.')}</p></div>}
    </section>
    {visible.length > 0 && <ListPagination page={pagination.page} totalPages={pagination.totalPages} onChange={pagination.setPage} vi={vi}/>}
    {selectedRow && createPortal(<div className="ar-overlay" onClick={() => { if (!saving) { setReview(null); setDetail(null); } }}><form className="ar-detail" role="dialog" aria-modal="true" aria-labelledby="application-detail-title" onClick={e => e.stopPropagation()} onSubmit={review ? submitReview : e => e.preventDefault()}>
      <header><span>{review ? (review.approve ? (vi ? 'Xác nhận duyệt đơn tham gia' : 'Approve application') : (vi ? 'Từ chối đơn tham gia' : 'Reject application')) : (vi ? 'Chi tiết đơn tham gia' : 'Application details')}</span><button className="ar-icon-button" type="button" disabled={saving} aria-label={vi ? 'Đóng' : 'Close'} onClick={() => { setReview(null); setDetail(null); }}><X size={21}/></button></header>
      <div className="ar-detail-body"><div className="ar-detail-title"><h2 id="application-detail-title">{selectedRow.orgName}</h2>{badge(selectedRow.status)}</div>
        <dl className="ar-facts"><div><dt>{vi ? 'Sự kiện' : 'Event'}</dt><dd>{selectedRow.eventTitle || selectedRow.eventId}</dd></div><div><dt>{vi ? 'Vai trò' : 'Role'}</dt><dd>{selectedRow.participationRole === 'organizer' ? (vi ? 'Đối tác tổ chức' : 'Organizing partner') : (vi ? 'Đối tác tham gia' : 'Participating partner')}</dd></div><div><dt>{vi ? 'Người đại diện' : 'Representative'}</dt><dd>{selectedRow.rep || '—'}</dd></div><div><dt>{vi ? 'Ngày nộp đơn' : 'Submitted'}</dt><dd>{selectedRow.date || '—'}</dd></div><div><dt>{vi ? 'Số điện thoại' : 'Phone'}</dt><dd>{selectedRow.phone ? <a href={`tel:${selectedRow.phone}`}>{selectedRow.phone}</a> : '—'}</dd></div><div><dt>Email</dt><dd>{selectedRow.email ? <a href={`mailto:${selectedRow.email}`}>{selectedRow.email}</a> : '—'}</dd></div></dl>
        {selectedRow.desc && <section className="ar-detail-section"><h3>{vi ? 'Thông tin đơn vị' : 'Organization details'}</h3><p>{selectedRow.desc}</p></section>}
        {selectedRow.reviewNote && <section className="ar-detail-section"><h3>{vi ? 'Ghi chú xét duyệt' : 'Review note'}</h3><p>{selectedRow.reviewNote}</p></section>}
        {review && (review.approve ? <p className="review-notice">{vi ? 'Duyệt đơn để xác nhận đối tác tham gia sự kiện. Kết quả sẽ được gửi qua thông báo trong hệ thống.' : 'Approval confirms participation and sends an in-app notification to the partner.'}</p> : <label className="review-field">{vi ? 'Lý do từ chối (bắt buộc)' : 'Rejection reason (required)'}<textarea required autoFocus maxLength={300} rows={4} value={note} disabled={saving} onChange={e => setNote(e.target.value)} placeholder={vi ? 'Nêu lý do để đối tác nắm thông tin…' : 'Explain the reason to the partner…'}/></label>)}
        {error && <p className="ar-error" role="alert">{error}</p>}
      </div><footer>{review ? <><button type="button" className="ar-button" disabled={saving} onClick={() => setReview(null)}>{vi ? 'Hủy bỏ' : 'Cancel'}</button><button type="submit" className={`ar-button ${review.approve ? 'ar-primary' : 'ar-danger'}`} disabled={saving || (!review.approve && !note.trim())}>{saving ? (vi ? 'Đang xử lý…' : 'Processing…') : review.approve ? (vi ? 'Xác nhận duyệt' : 'Confirm approval') : (vi ? 'Xác nhận từ chối' : 'Confirm rejection')}</button></> : <><button type="button" className="ar-button" onClick={() => setDetail(null)}>{vi ? 'Đóng' : 'Close'}</button>{pending(selectedRow) && <><button type="button" className="ar-button ar-danger" onClick={() => beginReview(selectedRow, false)}>{vi ? 'Từ chối' : 'Reject'}</button><button type="button" className="ar-button ar-primary" onClick={() => beginReview(selectedRow, true)}><Check size={16}/>{vi ? 'Duyệt đơn' : 'Approve'}</button></>}</>}</footer>
    </form></div>, document.body)}
  </div>;
}
