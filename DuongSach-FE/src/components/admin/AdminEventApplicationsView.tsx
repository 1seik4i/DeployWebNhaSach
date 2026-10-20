import { useModalBehavior } from '../../hooks/useModalBehavior';
import { ListPagination, useListPagination } from '../ui/ListPagination';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  RefreshCw,
  Search,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Inbox,
  Filter
} from 'lucide-react';
import { organizerApi, type OrganizerPartnerApplication } from '../../services/organizerApi';
import type { Language } from '../../types';
import './AdminEventApplicationsView.css';

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
  const [status, setStatus] = useState('pending');
  const [eventId, setEventId] = useState('all');
  const [review, setReview] = useState<{ row: OrganizerPartnerApplication; approve: boolean } | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useModalBehavior(Boolean(review), () => setReview(null), saving);
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
      setNotice(vi ? 'Đã lưu kết quả xét duyệt và gửi thông báo cho gian hàng.' : 'Review saved and the partner notified.');
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

  const getStatusBadge = (rowStatus: string) => {
    const isPending = ['submitted', 'need_changes'].includes(rowStatus);
    const isApproved = rowStatus === 'approved';
    const isRejected = rowStatus === 'rejected';

    let badgeClass = 'adm-badge-pending';
    let icon = <Clock size={13} />;
    if (isApproved) {
      badgeClass = 'adm-badge-approved';
      icon = <CheckCircle2 size={13} />;
    } else if (isRejected) {
      badgeClass = 'adm-badge-rejected';
      icon = <XCircle size={13} />;
    }

    return (
      <span className={`adm-status-badge-refined ${badgeClass}`}>
        {icon}
        <span>{statusNames[rowStatus]?.[vi ? 0 : 1] || rowStatus}</span>
      </span>
    );
  };

  return (
    <div className="adm-event-applications">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">{vi ? 'Đơn tham gia sự kiện' : 'Event Applications'}</h1>
          <p className="adm-page-subtitle">
            {vi ? 'Xét duyệt và quản lý hồ sơ đăng ký tham gia sự kiện của các gian hàng & nhà xuất bản.' : 'Review and manage event participation applications submitted by partners.'}
          </p>
        </div>
        <button
          className="adm-btn adm-btn-secondary"
          disabled={loading || saving}
          onClick={() => void refresh()}
          title={vi ? 'Tải lại danh sách' : 'Refresh list'}
        >
          <RefreshCw size={15} className={loading ? 'adm-spin' : ''} />
          <span>{vi ? 'Làm mới' : 'Refresh'}</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="adm-applications-summary" aria-label={vi ? 'Thống kê đơn' : 'Application counts'}>
        <button
          type="button"
          className={`adm-summary-card is-pending ${status === 'pending' ? 'is-selected' : ''}`}
          onClick={() => setStatus('pending')}
        >
          <div className="adm-summary-iconbox">
            <Clock size={22} />
          </div>
          <div className="adm-summary-text">
            <div className="adm-summary-count">{pendingCount}</div>
            <div className="adm-summary-label">{vi ? 'Chờ xét duyệt' : 'Pending Review'}</div>
          </div>
        </button>

        <button
          type="button"
          className={`adm-summary-card is-approved ${status === 'approved' ? 'is-selected' : ''}`}
          onClick={() => setStatus('approved')}
        >
          <div className="adm-summary-iconbox">
            <CheckCircle2 size={22} />
          </div>
          <div className="adm-summary-text">
            <div className="adm-summary-count">{approvedCount}</div>
            <div className="adm-summary-label">{vi ? 'Đã duyệt' : 'Approved'}</div>
          </div>
        </button>

        <button
          type="button"
          className={`adm-summary-card is-rejected ${status === 'rejected' ? 'is-selected' : ''}`}
          onClick={() => setStatus('rejected')}
        >
          <div className="adm-summary-iconbox">
            <XCircle size={22} />
          </div>
          <div className="adm-summary-text">
            <div className="adm-summary-count">{rejectedCount}</div>
            <div className="adm-summary-label">{vi ? 'Đã từ chối' : 'Rejected'}</div>
          </div>
        </button>
      </div>

      {notice && (
        <div className="adm-alert-notice" role="status">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')}><X size={14} /></button>
        </div>
      )}

      {error && (
        <div className="adm-alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="adm-applications-filters-wrap">
        <div className="adm-filter-search-box">
          <Search size={16} className="adm-filter-search-icon" />
          <input maxLength={200}
            className="adm-filter-search-input"
            aria-label={vi ? 'Tìm đơn đăng ký' : 'Search applications'}
            placeholder={vi ? 'Tìm theo tên gian hàng, người đại diện, số điện thoại, sự kiện…' : 'Search partner, representative, phone or event…'}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="adm-filter-clear-btn" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="adm-filter-select-group">
          <div className="adm-filter-select-wrapper">
            <Filter size={14} className="adm-select-icon" />
            <select
              className="adm-filter-select"
              aria-label={vi ? 'Lọc sự kiện' : 'Filter event'}
              value={eventId}
              onChange={e => setEventId(e.target.value)}
            >
              <option value="all">{vi ? 'Tất cả sự kiện' : 'All events'}</option>
              {events.map(([id, title]) => (
                <option key={id} value={id}>{title}</option>
              ))}
            </select>
          </div>

          <div className="adm-filter-select-wrapper">
            <select
              className="adm-filter-select"
              aria-label={vi ? 'Lọc trạng thái' : 'Filter status'}
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="all">{vi ? 'Tất cả trạng thái' : 'All statuses'}</option>
              <option value="pending">{vi ? 'Chờ xét duyệt' : 'Pending'}</option>
              {Object.entries(statusNames).map(([key, names]) => (
                <option key={key} value={key}>{names[vi ? 0 : 1]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Application List */}
      <section className="adm-applications-list-container" aria-busy={loading}>
        {loading ? (
          <div className="adm-state-box">
            <RefreshCw size={28} className="adm-spin" />
            <p>{vi ? 'Đang tải dữ liệu hồ sơ đăng ký…' : 'Loading applications…'}</p>
          </div>
        ) : error && !visible.length ? (
          <div className="adm-state-box adm-state-error">
            <AlertCircle size={32} />
            <p>{vi ? 'Không thể tải danh sách. Vui lòng thử lại.' : 'Unable to load applications. Please refresh.'}</p>
            <button className="adm-btn adm-btn-secondary" onClick={() => void refresh()}>{vi ? 'Thử lại' : 'Retry'}</button>
          </div>
        ) : !visible.length ? (
          <div className="adm-state-box">
            <Inbox size={42} strokeWidth={1.5} />
            <h3>{vi ? 'Không có đơn đăng ký nào' : 'No matching applications'}</h3>
            <p>{vi ? 'Chưa có hồ sơ nào phù hợp với bộ lọc hiện tại của bạn.' : 'No applications match your selected filter criteria.'}</p>
          </div>
        ) : (
          <div className="adm-applications-grid">
            {pagination.items.map(row => {
              const isPending = pending(row);
              return (
                <article key={row.id} className="adm-application-card">
                  <div className="adm-app-card-header">
                    <div className="adm-app-title-group">
                      <div className="adm-app-org-badge">
                        <Building2 size={16} />
                        <h2>{row.orgName}</h2>
                      </div>
                      <div className="adm-app-event-name">
                        <Calendar size={14} />
                        <span>{row.eventTitle || row.eventId}</span>
                      </div>
                    </div>
                    <div className="adm-app-status-wrap">
                      {getStatusBadge(row.status)}
                    </div>
                  </div>

                  <div className="adm-app-meta-grid">
                    <div className="adm-app-meta-item">
                      <User size={14} className="adm-meta-icon" />
                      <div>
                        <span className="adm-meta-label">{vi ? 'Người đại diện' : 'Representative'}</span>
                        <span className="adm-meta-val">{row.rep || '—'}</span>
                      </div>
                    </div>

                    <div className="adm-app-meta-item">
                      <Phone size={14} className="adm-meta-icon" />
                      <div>
                        <span className="adm-meta-label">{vi ? 'Số điện thoại' : 'Phone'}</span>
                        <a href={row.phone ? `tel:${row.phone}` : undefined} className="adm-meta-val is-link">
                          {row.phone || '—'}
                        </a>
                      </div>
                    </div>

                    {row.email && (
                      <div className="adm-app-meta-item adm-meta-item-wide">
                        <Mail size={14} className="adm-meta-icon" />
                        <div>
                          <span className="adm-meta-label">{vi ? 'Email liên hệ' : 'Contact email'}</span>
                          <a href={`mailto:${row.email}`} className="adm-meta-val is-link">{row.email}</a>
                        </div>
                      </div>
                    )}

                    <div className="adm-app-meta-item">
                      <Calendar size={14} className="adm-meta-icon" />
                      <div>
                        <span className="adm-meta-label">{vi ? 'Ngày nộp đơn' : 'Submitted date'}</span>
                        <span className="adm-meta-val">{row.date || '—'}</span>
                      </div>
                    </div>
                  </div>

                  {row.desc && (
                    <div className="adm-app-desc-box">
                      <div className="adm-app-desc-head">
                        <FileText size={13} />
                        <span>{vi ? 'Nội dung kế hoạch tham gia' : 'Participation details'}</span>
                      </div>
                      <p>{row.desc}</p>
                    </div>
                  )}

                  {row.reviewNote && (
                    <div className={`adm-app-review-note ${row.status === 'rejected' ? 'is-rejection' : ''}`}>
                      <strong>{vi ? 'Ghi chú ban tổ chức: ' : 'Review note: '}</strong>
                      <span>{row.reviewNote}</span>
                    </div>
                  )}

                  {isPending && (
                    <div className="adm-app-card-footer">
                      <div className="adm-app-footer-hint">
                        <span>{vi ? 'Cần xử lý phê duyệt để đối tác chuẩn bị gian hàng' : 'Requires approval to allocate booth resources'}</span>
                      </div>
                      <div className="adm-app-action-btns">
                        <button
                          type="button"
                          className="adm-btn adm-btn-reject"
                          disabled={saving}
                          onClick={() => {
                            setNote('');
                            setError('');
                            setNotice('');
                            setReview({ row, approve: false });
                          }}
                        >
                          <X size={15} />
                          <span>{vi ? 'Từ chối' : 'Reject'}</span>
                        </button>
                        <button
                          type="button"
                          className="adm-btn adm-btn-approve"
                          disabled={saving}
                          onClick={() => {
                            setNote('');
                            setError('');
                            setNotice('');
                            setReview({ row, approve: true });
                          }}
                        >
                          <Check size={15} />
                          <span>{vi ? 'Duyệt đơn' : 'Approve'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {visible.length > 0 && (
          <ListPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onChange={pagination.setPage}
            vi={vi}
          />
        )}
      </section>

      {/* Dialog Modal Phê Duyệt / Từ Chối */}
      {review && (
        <div
          className="adm-modal-overlay"
          onClick={() => {
            if (!saving) setReview(null);
          }}
        >
          <div
            className="adm-application-dialog"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <form onSubmit={submitReview} className="adm-dialog-form">
              <div className="adm-dialog-header">
                <div className="adm-dialog-iconbox" data-action={review.approve ? 'approve' : 'reject'}>
                  {review.approve ? <Check size={20} /> : <X size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2>
                    {review.approve
                      ? (vi ? 'Xác nhận duyệt đơn tham gia' : 'Approve Application')
                      : (vi ? 'Từ chối đơn tham gia' : 'Reject Application')}
                  </h2>
                  <p className="adm-dialog-subtext">
                    <strong>{review.row.orgName}</strong> — {review.row.eventTitle || review.row.eventId}
                  </p>
                </div>
                <button
                  type="button"
                  className="adm-modal-close"
                  disabled={saving}
                  onClick={() => setReview(null)}
                  title={vi ? 'Đóng' : 'Close'}
                  aria-label={vi ? 'Đóng' : 'Close'}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="adm-dialog-body">
                {review.approve ? (
                  <p className="adm-dialog-message">
                    {vi
                      ? 'Bạn có chắc chắn muốn phê duyệt đơn đăng ký của gian hàng này? Đơn vị sẽ nhận được email thông báo và được phân bổ vị trí hoạt động trong sự kiện.'
                      : 'Are you sure you want to approve this application? The partner will be notified via email and confirmed for the event.'}
                  </p>
                ) : (
                  <label className="adm-dialog-field">
                    <span>{vi ? 'Lý do từ chối (bắt buộc) *' : 'Rejection reason (required) *'}</span>
                    <textarea
                      className="adm-form-textarea"
                      required
                      maxLength={300}
                      rows={4}
                      value={note}
                      placeholder={vi ? 'Nhập lý do cụ thể để gian hàng nắm thông tin và khắc phục...' : 'Provide specific feedback for the partner...'}
                      disabled={saving}
                      onChange={e => setNote(e.target.value)}
                      autoFocus
                    />
                  </label>
                )}

                {error && (
                  <div className="adm-dialog-error" role="alert">
                    <AlertCircle size={15} />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="adm-dialog-footer">
                <button
                  type="button"
                  className="adm-btn adm-btn-secondary"
                  disabled={saving}
                  onClick={() => setReview(null)}
                >
                  {vi ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className={`adm-btn ${review.approve ? 'adm-btn-approve' : 'adm-btn-reject'}`}
                  disabled={saving || (!review.approve && !note.trim())}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="adm-spin" />
                      <span>{vi ? 'Đang xử lý…' : 'Processing…'}</span>
                    </>
                  ) : (
                    <span>{review.approve ? (vi ? 'Xác nhận duyệt' : 'Confirm Approval') : (vi ? 'Xác nhận từ chối' : 'Confirm Rejection')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

