import { useUrlTab } from '../../hooks/useUrlTab';
import { ListPagination, useListPagination } from '../ui/ListPagination';
import { confirmModal, notifyModal } from '../../services/notificationModal';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Eye, 
  AlertTriangle, 
  Check, 
  X, 
  CalendarDays,
  MapPin,
  Store,
  User,
  Mail,
  Phone,
  Wrench,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
  AlertCircle,
  Building2,
  Layers,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Language } from '../../types';
import { OrganizerActivityItem, OrganizerActivityProposal, OrganizerEvent } from '../../types/organizer';

type ReviewActivity = OrganizerActivityItem & {
  proposalId?: string;
  boothCode?: string;
  boothName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  reviewNote?: string;
  requiredEquipments?: string[];
  submittedAt?: string;
};

interface ActivityManagementViewProps {
  language: Language;
  activities: OrganizerActivityItem[];
  proposals?: OrganizerActivityProposal[];
  events?: OrganizerEvent[];
  selectedEventId?: string;
  onSelectEventId?: (eventId: string) => void;
  onOpenCreateActivity: () => void;
  onApproveActivity?: (id: string) => void;
  onRejectActivity?: (id: string) => void;
  onPublishActivity?: (id: string) => void;
  onUpdateActivity?: (updatedActivity: OrganizerActivityItem) => void;
  onDeleteActivity?: (activityId: string) => void;
  onDeleteProposal?: (proposalId: string) => void | Promise<void>;
  onOpenAttendanceForActivity?: (activityId: string) => void;
  onApproveProposal?: (proposalId: string) => void | Promise<void>;
  onRejectProposal?: (proposalId: string, note?: string) => void | Promise<void>;
  onRequestProposalSupplement?: (proposalId: string, note: string) => void | Promise<void>;
}

export const ActivityManagementView: React.FC<ActivityManagementViewProps> = ({
  language,
  activities,
  proposals = [],
  events = [],
  selectedEventId = '',
  onSelectEventId,
  onOpenCreateActivity,
  onApproveActivity,
  onRejectActivity,
  onUpdateActivity,
  onDeleteActivity,
  onDeleteProposal,
  onApproveProposal,
  onRejectProposal,
  onRequestProposalSupplement
}) => {
  const vi = language === 'vi';
  const [activeTab, setActiveTab] = useUrlTab(['all', 'pending', 'approved', 'cancelled'], 'all', 'section');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Detail Modal state (Read-only info form + Status update only)
  const [selectedActivity, setSelectedActivity] = useState<ReviewActivity | null>(null);
  const [modalStatus, setModalStatus] = useState<OrganizerActivityItem['status']>('pending');
  const [modalNote, setModalNote] = useState('');
  const [statusSuccessMsg, setStatusSuccessMsg] = useState<string | null>(null);

  // Reject with Optional Feedback Modal state
  const [rejectTarget, setRejectTarget] = useState<ReviewActivity | null>(null);

  useModalBehavior(Boolean(selectedActivity), () => handleCloseDetail());
  useModalBehavior(Boolean(rejectTarget), () => setRejectTarget(null));
  const [rejectFeedbackNote, setRejectFeedbackNote] = useState('');

  const reviewActivities: ReviewActivity[] = [
    ...proposals.map(proposal => ({
      id: `proposal:${proposal.id}`,
      proposalId: proposal.id,
      eventId: proposal.eventId,
      title: proposal.title,
      type: proposal.kind,
      dateStr: proposal.dateStr,
      timeStr: proposal.timeStr,
      location: proposal.location,
      capacity: proposal.capacity,
      registeredCount: 0,
      attendedCount: 0,
      partnerName: proposal.orgName,
      speaker: proposal.contactName,
      status: proposal.status,
      statusLabelVi: { pending: 'Chờ duyệt', need_revision: 'Cần chỉnh sửa', approved: 'Đã duyệt', rejected: 'Không duyệt' }[proposal.status] || 'Chờ duyệt',
      isPublished: false,
      thumbnail: proposal.thumbnail,
      description: proposal.description,
      hasConflict: proposal.hasConflict,
      conflictNotes: proposal.conflictNotes,
      boothCode: proposal.boothCode,
      boothName: proposal.boothName,
      contactName: proposal.contactName,
      contactEmail: proposal.contactEmail,
      contactPhone: proposal.contactPhone,
      reviewNote: proposal.reviewNote,
      requiredEquipments: proposal.requiredEquipments,
      submittedAt: proposal.submittedAt,
    })),
    ...activities,
  ];

  const isPendingLike = (status: string) => status === 'pending' || status === 'need_revision' || status === 'draft';
  const isApprovedLike = (status: string) => status === 'approved' || status === 'published' || status === 'ongoing' || status === 'completed';
  const isCancelledLike = (status: string) => status === 'cancelled' || status === 'rejected';

  const pendingCount = reviewActivities.filter(activity => isPendingLike(activity.status)).length;
  const approvedCount = reviewActivities.filter(activity => isApprovedLike(activity.status)).length;
  const cancelledCount = reviewActivities.filter(activity => isCancelledLike(activity.status)).length;

  const filteredActivities = reviewActivities.filter(act => {
    if (selectedEventId && selectedEventId !== 'all' && act.eventId !== selectedEventId) return false;
    if (activeTab === 'pending' && !isPendingLike(act.status)) return false;
    if (activeTab === 'approved' && !isApprovedLike(act.status)) return false;
    if (activeTab === 'cancelled' && !isCancelledLike(act.status)) return false;
    if (typeFilter !== 'all' && act.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().normalize('NFC').toLowerCase();
      return act.title.normalize('NFC').toLowerCase().includes(q) || (act.speaker && act.speaker.normalize('NFC').toLowerCase().includes(q)) || (act.location && act.location.normalize('NFC').toLowerCase().includes(q));
    }
    return true;
  });

  const pagination = useListPagination(filteredActivities, `${selectedEventId}:${activeTab}:${typeFilter}:${searchQuery}`, 8);

  const handleOpenDetail = (act: ReviewActivity) => {
    setSelectedActivity(act);
    setModalStatus(act.status);
    setModalNote(act.reviewNote || '');
    setStatusSuccessMsg(null);
  };

  const handleCloseDetail = () => {
    setSelectedActivity(null);
    setStatusSuccessMsg(null);
  };

  // Quick Approve on Card
  const handleDirectApprove = (act: ReviewActivity) => {
    if (act.proposalId) {
      void onApproveProposal?.(act.proposalId);
    } else {
      onApproveActivity?.(act.id);
    }
  };

  // Open Reject Dialog
  const handleOpenRejectModal = (act: ReviewActivity) => {
    setRejectTarget(act);
    setRejectFeedbackNote('');
  };

  const handleDeleteActivity = async (act: ReviewActivity) => {
    try {
      if (act.proposalId) {
        if (!onDeleteProposal) return;
        if (!await confirmModal(`Xóa đề xuất "${act.title}"? Thao tác này không thể hoàn tác.`)) return;
        await onDeleteProposal(act.proposalId);
      } else {
        if (!onDeleteActivity) return;
        if (!await confirmModal(`Xóa hoạt động "${act.title}"? Thao tác này không thể hoàn tác.`)) return;
        await onDeleteActivity(act.id);
      }
      if (selectedActivity?.id === act.id) handleCloseDetail();
    } catch (error) {
      void notifyModal(error instanceof Error ? error.message : 'Không thể xóa hoạt động.');
    }
  };

  // A direct rejection may be submitted without a note.
  const handleConfirmReject = () => {
    if (!rejectTarget) return;
    const note = rejectFeedbackNote.trim();

    if (rejectTarget.proposalId) {
      void onRejectProposal?.(rejectTarget.proposalId, note || undefined);
    } else {
      onRejectActivity?.(rejectTarget.id);
    }

    setRejectTarget(null);
    setRejectFeedbackNote('');

    // Nếu đang mở trong modal detail thì đóng lại
    if (selectedActivity?.id === rejectTarget.id) {
      handleCloseDetail();
    }
  };

  // Save Status Change from Detail Modal (The only editable action in Organizer role)
  const handleSaveModalStatus = async () => {
    if (!selectedActivity) return;

    if (selectedActivity.proposalId) {
      if (modalStatus === 'approved') {
        await onApproveProposal?.(selectedActivity.proposalId);
      } else if (modalStatus === 'rejected') {
        await onRejectProposal?.(selectedActivity.proposalId, modalNote.trim() || undefined);
      } else if (modalStatus === 'need_revision') {
        if (!modalNote.trim()) {
          void notifyModal('Vui lòng nhập ghi chú cần chỉnh sửa cho đối tác.');
          return;
        }
        await onRequestProposalSupplement?.(selectedActivity.proposalId, modalNote.trim());
      }
    } else {
      const labels: Record<string, string> = {
        approved: 'Đã duyệt',
        pending: 'Chờ duyệt',
        need_revision: 'Cần chỉnh sửa',
        rejected: 'Từ chối',
        cancelled: 'Đã hủy'
      };
      if (modalStatus === 'approved') {
        onApproveActivity?.(selectedActivity.id);
      } else if (modalStatus === 'rejected' || modalStatus === 'cancelled') {
        onRejectActivity?.(selectedActivity.id);
      } else if (onUpdateActivity) {
        onUpdateActivity({
          ...selectedActivity,
          status: modalStatus,
          statusLabelVi: labels[modalStatus] || modalStatus
        });
      }
    }

    setStatusSuccessMsg(
      modalStatus === 'need_revision'
        ? (vi ? 'Đã gửi ghi chú cho đối tác và không duyệt đề xuất.' : 'Notes sent to the partner and proposal rejected.')
        : (vi ? 'Đã cập nhật trạng thái hoạt động thành công!' : 'Activity status updated successfully!'),
    );
    setTimeout(() => {
      handleCloseDetail();
    }, 1200);
  };

  // Helper render status chip
  const renderStatusBadge = (status: OrganizerActivityItem['status'], labelVi?: string) => {
    switch (status) {
      case 'published':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 99,
            fontSize: '0.74rem',
            fontWeight: 700,
            background: '#DCFCE7',
            color: '#15803D',
            border: '1px solid #86EFAC'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
            {labelVi || (vi ? 'Đã công bố' : 'Published')}
          </span>
        );
      case 'ongoing':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 99,
            fontSize: '0.74rem',
            fontWeight: 700,
            background: '#E0F2FE',
            color: '#0369A1',
            border: '1px solid #BAE6FD'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284C7' }} />
            {labelVi || (vi ? 'Đang diễn ra' : 'Ongoing')}
          </span>
        );
      case 'completed':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 99,
            fontSize: '0.74rem',
            fontWeight: 700,
            background: '#F1F5F9',
            color: '#475569',
            border: '1px solid #CBD5E1'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748B' }} />
            {labelVi || (vi ? 'Đã kết thúc' : 'Completed')}
          </span>
        );
      case 'draft':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 99,
            fontSize: '0.74rem',
            fontWeight: 700,
            background: '#F3F4F6',
            color: '#4B5563',
            border: '1px solid #E5E7EB'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF' }} />
            {labelVi || (vi ? 'Bản nháp' : 'Draft')}
          </span>
        );
      case 'approved':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 99,
            fontSize: '0.74rem',
            fontWeight: 700,
            background: '#DCFCE7',
            color: '#15803D',
            border: '1px solid #86EFAC'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
            {labelVi || (vi ? 'Đã duyệt' : 'Approved')}
          </span>
        );
      case 'need_revision':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 99,
            fontSize: '0.74rem',
            fontWeight: 700,
            background: '#FFF7ED',
            color: '#C2410C',
            border: '1px solid #FFEDD5'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EA580C' }} />
            {labelVi || (vi ? 'Cần chỉnh sửa' : 'Needs Revision')}
          </span>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 99,
            fontSize: '0.74rem',
            fontWeight: 700,
            background: '#FEE2E2',
            color: '#991B1B',
            border: '1px solid #FECACA'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DC2626' }} />
            {labelVi || (vi ? 'Không duyệt' : 'Rejected')}
          </span>
        );
      case 'pending':
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 99,
            fontSize: '0.74rem',
            fontWeight: 700,
            background: '#FEF3C7',
            color: '#92400E',
            border: '1px solid #FDE68A'
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D97706' }} />
            {labelVi || (vi ? 'Chờ duyệt' : 'Pending')}
          </span>
        );
    }
  };

  return (
    <div className="organizer-content org-activities-page">
      {/* 1. Header with title and Create button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h1 className="organizer-view-title" style={{ margin: '0 0 0.35rem 0' }}>
            {vi ? 'Danh sách hoạt động' : 'Activity Management'}
          </h1>
          <p className="organizer-view-sub" style={{ margin: 0 }}>
            {vi ? 'Quản lý lịch, địa điểm và trạng thái hoạt động' : 'Manage activity schedules, locations and statuses'}
          </p>
        </div>

        <button
          type="button"
          className="btn-org-primary"
          onClick={onOpenCreateActivity}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, fontSize: '0.86rem', fontWeight: 600 }}
        >
          <Plus size={16} />
          <span>{vi ? 'Tạo sự kiện' : 'Create Event'}</span>
        </button>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="org-toolbar" style={{ marginBottom: '1.5rem' }}>
        <div className="org-tabs-bar" style={{ marginBottom: 0, borderBottom: 'none' }}>
          <button
            type="button"
            className={`org-tab-btn ${activeTab === 'all' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            {vi ? `Tất cả (${reviewActivities.length})` : `All (${reviewActivities.length})`}
          </button>
          <button
            type="button"
            className={`org-tab-btn ${activeTab === 'pending' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            {vi ? `Chờ duyệt (${pendingCount})` : `Pending (${pendingCount})`}
          </button>
          <button
            type="button"
            className={`org-tab-btn ${activeTab === 'approved' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            {vi ? `Đã duyệt (${approvedCount})` : `Approved (${approvedCount})`}
          </button>
          <button
            type="button"
            className={`org-tab-btn ${activeTab === 'cancelled' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            {vi ? `Đã hủy (${cancelledCount})` : `Cancelled (${cancelledCount})`}
          </button>
        </div>

        <div className="org-toolbar-left org-toolbar-controls">
          <div className="organizer-search-box">
            <Search size={15} />
            <input maxLength={200}
              type="text"
              placeholder={vi ? 'Tìm kiếm hoạt động...' : 'Search activity...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {events && events.length > 0 && (
            <select
              className="org-filter-select"
              value={selectedEventId || 'all'}
              onChange={(e) => onSelectEventId?.(e.target.value === 'all' ? '' : e.target.value)}
            >
              <option value="all">{vi ? 'Tất cả sự kiện' : 'All Events'}</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
          )}

          <select
            className="org-filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">{vi ? 'Tất cả loại' : 'All Types'}</option>
            <option value="Talkshow">Talkshow</option>
            <option value="Workshop">Workshop</option>
            <option value="Mini Game">Mini Game</option>
            <option value="Nghệ thuật">{vi ? 'Nghệ thuật' : 'Art'}</option>
            <option value="Ký tặng sách">{vi ? 'Ký tặng sách' : 'Book Signing'}</option>
            <option value="Tọa đàm">{vi ? 'Tọa đàm' : 'Panel'}</option>
          </select>
        </div>
      </div>

      {/* 3. Conflict Alert Banner if any conflict detected */}
      {activities.some(a => a.hasConflict) && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderLeft: '4px solid #D97706',
          borderRadius: '8px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          fontSize: '0.84rem',
          color: '#92400E'
        }}>
          <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0 }} />
          <span>
            {vi
              ? 'Phát hiện 1 đề xuất có xung đột địa điểm / khung giờ với lịch kỹ thuật (Workshop Phục chế sách cổ tại Khu A).'
              : '1 proposal has detected schedule/location conflict at Workshop Zone A.'}
          </span>
        </div>
      )}

      {/* 4. Activity Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {pagination.items.map((act) => (
          <div
            key={act.id}
            className={`organizer-card org-act-manage-card ${act.hasConflict ? 'has-conflict' : ''}`}
          >
            {/* Khối Thông tin chính (Thumbnail + Tiêu đề + Thời gian/Địa điểm) */}
            <div className="org-act-card-main">
              {act.thumbnail ? (
                <img
                  src={act.thumbnail}
                  alt={act.title}
                  className="org-act-card-thumb"
                />
              ) : (
                <div className="org-act-card-thumb-placeholder">
                  {vi ? 'Chưa có ảnh' : 'No image'}
                </div>
              )}

              <div className="org-act-card-info">
                <h3 title={act.title} className="org-act-card-title">
                  {act.title}
                </h3>

                <div className="org-act-card-meta">
                  <span className="org-act-meta-item">
                    <CalendarDays size={14} color="#059669" />
                    <span>{act.dateStr} · {act.timeStr}</span>
                  </span>

                  <span 
                    className="org-act-meta-item"
                    title={act.proposalId ? `${act.boothCode} · ${act.boothName}` : act.location}
                  >
                    {act.proposalId ? <Store size={14} color="#B48A3C" /> : <MapPin size={14} color="#0284C7" />}
                    <span>{act.proposalId ? `${act.boothCode} · ${act.boothName}` : act.location}</span>
                  </span>
                </div>

                {act.hasConflict && (
                  <div className="org-act-conflict-tag">
                    <AlertTriangle size={13} />
                    <span>{vi ? 'Có xung đột lịch / địa điểm' : 'Schedule conflict detected'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* CỘT RIÊNG CHO CÁC TAG (Thể loại & Trạng thái) */}
            <div className="org-act-card-tags">
              <span className="org-act-type-tag">
                {act.type}
              </span>
              {renderStatusBadge(act.status, act.statusLabelVi)}
            </div>

            {/* Khối Nút Tác vụ (Xem chi tiết & Phê duyệt / Không duyệt) */}
            <div className="org-act-card-actions">
              <button
                type="button"
                className="btn-org-secondary org-act-btn"
                onClick={() => handleOpenDetail(act)}
                title={vi ? 'Xem thông tin chi tiết hoạt động' : 'View activity details'}
              >
                <Eye size={14} />
                <span>{vi ? 'Chi tiết' : 'Details'}</span>
              </button>

              {act.status !== 'pending' && ((act.proposalId && onDeleteProposal) || (!act.proposalId && onDeleteActivity)) && (
                <button
                  type="button"
                  className="btn-org-secondary org-act-btn org-act-btn-delete"
                  onClick={() => void handleDeleteActivity(act)}
                  title={vi ? (act.proposalId ? 'Xóa đề xuất' : 'Xóa hoạt động') : (act.proposalId ? 'Delete proposal' : 'Delete activity')}
                >
                  <Trash2 size={14} />
                  <span>{vi ? 'Xóa' : 'Delete'}</span>
                </button>
              )}

              {act.status === 'pending' && (
                <>
                  <button
                    type="button"
                    className="btn-org-primary org-act-btn org-act-btn-approve"
                    onClick={() => handleDirectApprove(act)}
                    title={vi ? 'Phê duyệt hoạt động này' : 'Approve activity'}
                  >
                    <Check size={14} />
                    <span>{vi ? 'Duyệt' : 'Approve'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn-org-secondary org-act-btn org-act-btn-reject"
                    onClick={() => handleOpenRejectModal(act)}
                    title={vi ? 'Không phê duyệt (Cho phép góp ý hoặc không)' : 'Reject (With optional feedback)'}
                  >
                    <X size={14} />
                    <span>{vi ? 'Từ chối' : 'Reject'}</span>
                  </button>
                </>
              )}

              {act.status === 'need_revision' && (
                <button
                  type="button"
                  className="btn-org-secondary org-act-btn org-act-btn-note"
                  onClick={() => {
                    handleOpenDetail(act);
                    setModalStatus('need_revision');
                    setModalNote('');
                  }}
                  title={vi ? 'Gửi ghi chú cho đối tác và không duyệt đề xuất' : 'Send notes to the partner and reject proposal'}
                >
                  <MessageSquare size={14} />
                  <span>{vi ? 'Ghi chú & không duyệt' : 'Note & reject'}</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredActivities.length === 0 && (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>
            {vi ? 'Không tìm thấy hoạt động nào phù hợp với bộ lọc.' : 'No activities found matching criteria.'}
          </div>
        )}
      </div>

      {filteredActivities.length > 0 && (
        <ListPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onChange={pagination.setPage}
          vi={vi}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 1: XEM CHI TIẾT HOẠT ĐỘNG (FORM CHỈ ĐỌC + CHỈNH TRẠNG THÁI) */}
      {/* ======================================================== */}
      {selectedActivity && (
        <div className="org-modal-backdrop" onClick={handleCloseDetail}>
          <div 
            className="org-modal-box" 
            style={{ 
              maxWidth: '740px', 
              width: '100%', 
              maxHeight: '90vh', 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 16,
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              style={{
                padding: '1.15rem 1.5rem',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFFFFF'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', display: 'grid', placeItems: 'center', color: '#182924' }}>
                  <FileText size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.08rem', color: '#111827', fontWeight: 700 }}>
                    {vi ? 'Thông tin chi tiết hoạt động' : 'Activity Information Details'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#6B7280' }}>
                    {vi ? 'Chế độ xem thông tin chỉ đọc dành cho Ban Quản Lý' : 'Read-only preview mode for Organizer'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.5rem', background: '#F8FAFC' }}>
              {statusSuccessMsg && (
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 10,
                  background: '#DCFCE7',
                  border: '1px solid #86EFAC',
                  color: '#15803D',
                  marginBottom: '1.25rem',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <CheckCircle2 size={16} />
                  <span>{statusSuccessMsg}</span>
                </div>
              )}

              {/* Banner Top Hero */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: 12,
                border: '1px solid #E2E8F0',
                padding: '1.25rem',
                marginBottom: '1.25rem',
                display: 'flex',
                gap: '1.25rem',
                alignItems: 'center'
              }}>
                {selectedActivity.thumbnail ? (
                  <img
                    src={selectedActivity.thumbnail}
                    alt={selectedActivity.title}
                    style={{
                      width: 140,
                      height: 95,
                      borderRadius: 10,
                      objectFit: 'cover',
                      border: '1px solid #E2E8F0',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <div style={{
                    width: 140,
                    height: 95,
                    borderRadius: 10,
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#94A3B8',
                    fontSize: '0.78rem',
                    flexShrink: 0
                  }}>
                    {vi ? 'Chưa có ảnh bìa' : 'No thumbnail'}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 5,
                      background: '#F1F5F9',
                      color: '#334155',
                      fontSize: '0.72rem',
                      fontWeight: 700
                    }}>
                      {selectedActivity.type}
                    </span>
                    {renderStatusBadge(selectedActivity.status, selectedActivity.statusLabelVi)}
                  </div>

                  <h2 style={{ margin: '0 0 6px 0', fontSize: '1.18rem', fontWeight: 700, color: '#111827', lineHeight: 1.35 }}>
                    {selectedActivity.title}
                  </h2>

                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    {selectedActivity.partnerName && (
                      <span style={{ fontWeight: 600, color: '#182924' }}>
                        {selectedActivity.partnerName}
                      </span>
                    )}
                    {selectedActivity.speaker && (
                      <span> · Diễn giả: <strong>{selectedActivity.speaker}</strong></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cảnh báo xung đột nếu có */}
              {selectedActivity.hasConflict && (
                <div style={{
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: 10,
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: '1.25rem',
                  fontSize: '0.82rem',
                  color: '#92400E'
                }}>
                  <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0 }} />
                  <span><strong>{vi ? 'Cảnh báo xung đột:' : 'Conflict warning:'}</strong> {selectedActivity.conflictNotes || '—'}</span>
                </div>
              )}

              {/* Lưới thông tin chi tiết (Read-only Form fields) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                marginBottom: '1.25rem'
              }}>
                {/* 1. Lịch trình */}
                <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                    <CalendarDays size={14} color="#059669" />
                    <span>{vi ? 'THỜI GIAN TỔ CHỨC' : 'SCHEDULE TIME'}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                    {selectedActivity.dateStr}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#4B5563', marginTop: 2 }}>
                    {selectedActivity.timeStr}
                  </div>
                </div>

                {/* 2. Địa điểm */}
                <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                    <MapPin size={14} color="#0284C7" />
                    <span>{vi ? 'ĐỊA ĐIỂM / GIAN HÀNG' : 'LOCATION / BOOTH'}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                    {selectedActivity.proposalId 
                      ? `${selectedActivity.boothCode} · ${selectedActivity.boothName}` 
                      : selectedActivity.location}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#4B5563', marginTop: 2 }}>
                    {selectedActivity.proposalId ? (vi ? 'Gian hàng thuộc sự kiện' : 'Event booth') : (vi ? 'Khu vực công cộng Đường Sách' : 'Public book street zone')}
                  </div>
                </div>

                {/* 3. Đơn vị & Người liên hệ */}
                <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                    <User size={14} color="#B48A3C" />
                    <span>{vi ? 'NGƯỜI LIÊN HỆ / PHỤ TRÁCH' : 'CONTACT PERSON'}</span>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111827' }}>
                    {selectedActivity.contactName || selectedActivity.speaker || '—'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 3 }}>
                    {selectedActivity.contactEmail && <div>✉️ {selectedActivity.contactEmail}</div>}
                    {selectedActivity.contactPhone && <div>📞 {selectedActivity.contactPhone}</div>}
                  </div>
                </div>

                {/* 4. Thiết bị & Cơ sở vật chất */}
                <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                    <Wrench size={14} color="#6366F1" />
                    <span>{vi ? 'THIẾT BỊ ĐỀ XUẤT' : 'REQUIRED EQUIPMENT'}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#1E293B', lineHeight: 1.4 }}>
                    {selectedActivity.requiredEquipments?.length 
                      ? selectedActivity.requiredEquipments.join(', ') 
                      : (vi ? 'Không yêu cầu thiết bị bổ sung.' : 'Standard equipment only.')}
                  </div>
                </div>
              </div>

              {/* Mô tả chi tiết nội dung */}
              <div style={{ background: '#FFFFFF', padding: '1.1rem 1.25rem', borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: 6 }}>
                  <FileText size={14} />
                  <span>{vi ? 'MÔ TẢ CHI TIẾT NỘI DUNG CHƯƠNG TRÌNH' : 'DETAILED ACTIVITY DESCRIPTION'}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {selectedActivity.description || (vi ? 'Chưa có thông tin mô tả chi tiết cho hoạt động này.' : 'No description provided.')}
                </p>
              </div>

              {/* Ghi chú góp ý trước đó (nếu có) */}
              {selectedActivity.reviewNote && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FEF3C7', padding: '0.9rem 1.1rem', borderRadius: 10, marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#B45309', marginBottom: 3 }}>
                    <MessageSquare size={13} />
                    <span>{vi ? 'Ghi chú / Góp ý gần nhất:' : 'Latest feedback note:'}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#92400E' }}>
                    {selectedActivity.reviewNote}
                  </div>
                </div>
              )}

              {/* ====================================================== */}
              {/* VÙNG CHỈNH SỬA DUY NHẤT: QUẢN LÝ TRẠNG THÁI HOẠT ĐỘNG */}
              {/* ====================================================== */}
              <div style={{
                background: '#FFFFFF',
                padding: '1.25rem',
                borderRadius: 12,
                border: '1.5px solid #182924',
                boxShadow: '0 4px 14px rgba(24, 41, 36, 0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: '0.85rem' }}>
                  <Sparkles size={16} color="#B48A3C" />
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#182924' }}>
                    {vi ? 'Phê duyệt & Điều chỉnh trạng thái hoạt động' : 'Update Activity Approval Status'}
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
                  {/* Option 1: Chờ duyệt */}
                  <button
                    type="button"
                    onClick={() => setModalStatus('pending')}
                    style={{
                      padding: '10px',
                      borderRadius: 8,
                      border: modalStatus === 'pending' ? '2px solid #D97706' : '1px solid #E2E8F0',
                      background: modalStatus === 'pending' ? '#FEF3C7' : '#F8FAFC',
                      color: modalStatus === 'pending' ? '#92400E' : '#64748B',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Clock size={14} />
                    <span>{vi ? 'Chờ duyệt' : 'Pending'}</span>
                  </button>

                  {/* A proposal marked for revision can no longer be approved. */}
                  {selectedActivity.status !== 'need_revision' && <button
                    type="button"
                    onClick={() => setModalStatus('approved')}
                    style={{
                      padding: '10px',
                      borderRadius: 8,
                      border: modalStatus === 'approved' ? '2px solid #16A34A' : '1px solid #E2E8F0',
                      background: modalStatus === 'approved' ? '#DCFCE7' : '#F8FAFC',
                      color: modalStatus === 'approved' ? '#15803D' : '#64748B',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Check size={14} />
                    <span>{vi ? 'Đã duyệt' : 'Approve'}</span>
                  </button>}

                  {/* Option 3: Cần chỉnh sửa, đồng thời không duyệt */}
                  <button
                    type="button"
                    onClick={() => setModalStatus('need_revision')}
                    style={{
                      padding: '10px',
                      borderRadius: 8,
                      border: modalStatus === 'need_revision' ? '2px solid #EA580C' : '1px solid #E2E8F0',
                      background: modalStatus === 'need_revision' ? '#FFEDD5' : '#F8FAFC',
                      color: modalStatus === 'need_revision' ? '#C2410C' : '#64748B',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <MessageSquare size={14} />
                    <span>{vi ? 'Cần chỉnh sửa' : 'Needs revision'}</span>
                  </button>

                  {/* Option 4: Không duyệt / Từ chối */}
                  <button
                    type="button"
                    onClick={() => setModalStatus('rejected')}
                    style={{
                      padding: '10px',
                      borderRadius: 8,
                      border: modalStatus === 'rejected' ? '2px solid #DC2626' : '1px solid #E2E8F0',
                      background: modalStatus === 'rejected' ? '#FEE2E2' : '#F8FAFC',
                      color: modalStatus === 'rejected' ? '#991B1B' : '#64748B',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <X size={14} />
                    <span>{vi ? 'Không duyệt' : 'Reject'}</span>
                  </button>
                </div>

                {/* Ghi chú là bắt buộc khi yêu cầu chỉnh sửa hoặc không duyệt. */}
                {(modalStatus === 'need_revision' || modalStatus === 'rejected') && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                      {modalStatus === 'need_revision' 
                        ? (vi ? 'Ghi chú cần chỉnh sửa (gửi cho đối tác, đề xuất sẽ không duyệt):' : 'Revision notes for partner; proposal will be rejected:') 
                        : (vi ? 'Lý do từ chối / Góp ý (gửi cho đối tác):' : 'Rejection reason / feedback for partner:')}
                    </label>
                    <textarea maxLength={2000}
                      rows={3}
                      value={modalNote}
                      onChange={e => setModalNote(e.target.value)}
                      placeholder={modalStatus === 'need_revision' 
                        ? (vi ? 'Nêu rõ nội dung cần đối tác điều chỉnh hoặc bổ sung. Đề xuất này sẽ không được duyệt...' : 'Explain the required adjustments. This proposal will be rejected...') 
                        : (vi ? 'Nhập lý do không duyệt...' : 'Enter the rejection reason...')}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '0.6rem 0.75rem',
                        fontSize: '0.82rem',
                        border: '1px solid #CBD5E1',
                        borderRadius: 8,
                        resize: 'vertical'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div 
              style={{
                padding: '0.9rem 1.5rem',
                borderTop: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFFFFF'
              }}
            >
              <button
                type="button"
                className="btn-org-secondary"
                onClick={handleCloseDetail}
                style={{ fontSize: '0.84rem', padding: '8px 16px' }}
              >
                {vi ? 'Đóng' : 'Close'}
              </button>

              <button
                type="button"
                className="btn-org-primary"
                onClick={handleSaveModalStatus}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  fontSize: '0.84rem', 
                  padding: '8px 20px', 
                  background: '#182924', 
                  color: '#FFFFFF',
                  borderRadius: 8,
                  fontWeight: 600
                }}
              >
                <Check size={15} />
                <span>{vi ? 'Cập nhật trạng thái' : 'Update Status'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: KHÔNG DUYỆT HOẠT ĐỘNG (CHO PHÉP GÓP Ý HOẶC KHÔNG) */}
      {/* ======================================================== */}
      {rejectTarget && (
        <div className="org-modal-backdrop" onClick={() => setRejectTarget(null)}>
          <div 
            className="org-modal-box" 
            style={{ maxWidth: '480px', width: '100%', borderRadius: 16, overflow: 'hidden' }} 
            onClick={event => event.stopPropagation()}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E5E7EB', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#FEE2E2', display: 'grid', placeItems: 'center', color: '#DC2626' }}>
                  <X size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#991B1B', fontWeight: 700 }}>
                    {vi ? 'Xác nhận không duyệt hoạt động' : 'Confirm Activity Rejection'}
                  </h3>
                  <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.78rem' }}>
                    {rejectTarget.title}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', background: '#F8FAFC' }}>
              <p style={{ marginTop: 0, color: '#475569', fontSize: '0.84rem', lineHeight: 1.5 }}>
                {vi 
                  ? 'Bạn có thể nhập góp ý/lý do từ chối để phản hồi lại cho đơn vị tổ chức, hoặc bấm xác nhận không duyệt ngay.' 
                  : 'You can optionally provide feedback/rejection reason for the partner, or reject directly.'}
              </p>

              <div style={{ marginTop: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  {vi ? 'Góp ý / Lý do không duyệt (Không bắt buộc):' : 'Feedback / Rejection Reason (Optional):'}
                </label>
                <textarea maxLength={2000}
                  value={rejectFeedbackNote} 
                  onChange={event => setRejectFeedbackNote(event.target.value)} 
                  rows={4} 
                  placeholder={vi ? 'Nhập góp ý cho đối tác hoặc để trống nếu không có góp ý...' : 'Enter feedback or leave empty...'} 
                  style={{ 
                    width: '100%', 
                    boxSizing: 'border-box', 
                    padding: '0.65rem 0.8rem', 
                    border: '1px solid #CBD5E1', 
                    borderRadius: 8, 
                    fontSize: '0.84rem',
                    resize: 'vertical' 
                  }} 
                />
              </div>
            </div>

            <div style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', background: '#FFFFFF' }}>
              <button 
                type="button" 
                className="btn-org-secondary" 
                onClick={() => setRejectTarget(null)}
                style={{ fontSize: '0.84rem', padding: '7px 14px' }}
              >
                {vi ? 'Hủy' : 'Cancel'}
              </button>

              <button 
                type="button" 
                onClick={handleConfirmReject}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 8,
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  background: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >                
                <span>{vi ? 'Xác nhận không duyệt' : 'Confirm Reject'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
