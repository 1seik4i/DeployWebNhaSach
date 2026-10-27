import React from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarDays, 
  Store, 
  Layers, 
  Users, 
  ArrowRight, 
  Clock, 
  AlertCircle, 
  FileText,
  PlusCircle,
  BookOpen
} from 'lucide-react';
import { 
  Language, 
  PartnerOrganization, 
  PartnerEventApplication, 
  PartnerBooth, 
  PartnerActivityProposal, 
  PartnerTodoItem 
} from '../../types';
import './PartnerPages.css';
import { activityDateKey } from '../../utils/activityDate';
import { vietnamDateKey } from '../../utils/inputValidation';

interface PartnerDashboardProps {
  language: Language;
  organization: PartnerOrganization;
  activeEvent: PartnerEventApplication;
  assignedBooth?: PartnerBooth;
  activities: PartnerActivityProposal[];
  todos: PartnerTodoItem[];
  totalEngagementCount?: number;
  joinedEventsCount?: number;
  onOpenAttendanceModal?: () => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({
  language,
  organization,
  activeEvent,
  assignedBooth,
  activities,
  todos,
  totalEngagementCount = 0,
  joinedEventsCount = 1,
}) => {
  const proposedActivitiesCount = activities.length;
  const today = vietnamDateKey();
  const visibleTodos = todos.filter(todo => {
    const deadline = todo.deadline.trim().replace(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      (_, day: string, month: string, year: string) => `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`,
    );
    const deadlineKey = activityDateKey(deadline) || vietnamDateKey(deadline);
    return !deadlineKey || deadlineKey >= today;
  });

  // Lấy hoạt động vừa có thông tin mới nhất (dựa trên updatedAt hoặc submittedAt hoặc createdAt)
  const latestActivity = activities.length > 0
    ? [...activities].sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.submittedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.updatedAt || b.submittedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
      })[0]
    : undefined;

  const getActivityStatusBadge = (status: PartnerActivityProposal['status']) => {
    switch (status) {
      case 'approved':
        return { className: 'approved', label: language === 'vi' ? 'Đã được chấp thuận' : 'Approved' };
      case 'need_changes':
        return { className: 'need_changes', label: language === 'vi' ? 'Cần điều chỉnh' : 'Need changes' };
      case 'rejected':
        return { className: 'rejected', label: language === 'vi' ? 'Đã từ chối' : 'Rejected' };
      case 'withdrawn':
        return { className: 'withdrawn', label: language === 'vi' ? 'Đã rút' : 'Withdrawn' };
      case 'pending':
      default:
        return { className: 'pending', label: language === 'vi' ? 'Đang chờ duyệt' : 'Pending review' };
    }
  };

  return (
    <div className="partner-dashboard-page">
      {/* 1. Header Greeting (Đã bỏ nút quét QR điểm danh) */}
      <div className="partner-page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <span className="partner-page-eyebrow">
            {language === 'vi' ? `XIN CHÀO, ${organization.name.toUpperCase()}` : `WELCOME, ${organization.name.toUpperCase()}`}
          </span>
          <h1 className="partner-page-title">
            {language === 'vi' ? 'Tổng quan' : 'Dashboard'}
          </h1>
          <p className="partner-page-sub">
            {language === 'vi' 
              ? 'Hệ thống quản lý hoạt động, theo dõi tiến độ sự kiện và gian hàng tại Đường Sách.' 
              : 'Stall operations, event tracking, and booth coordination at HCMC Book Street.'}
          </p>
        </div>
      </div>

      <Link to="/partner/books" className="partner-sales-reminder">
        <div className="partner-sales-reminder-main">
          <span className="partner-sales-reminder-icon"><BookOpen size={20} /></span>
          <div className="partner-sales-reminder-body">
            <strong>{language === 'vi' ? 'Quản lý sách tại gian hàng' : 'Manage stall books'}</strong>
            <small>{language === 'vi' ? 'Cập nhật tồn kho, số lượng đã bán tùy chọn và theo dõi kiểm duyệt.' : 'Update inventory, optional sold quantity and moderation status.'}</small>
          </div>
        </div>
        <span className="partner-sales-reminder-link">
          <span>{language === 'vi' ? 'Mở quản lý' : 'Open management'}</span>
          <ArrowRight size={14} />
        </span>
      </Link>

      {/* 2. Hoạt động vừa có thông tin mới nhất trên Dashboard */}
      {latestActivity ? (
        <div className="partner-active-event-card">
          <div className="event-card-left">
            <img 
              src={latestActivity.imageUrl || activeEvent.imageUrl} 
              alt={latestActivity.title} 
              className="event-thumb-img"
            />
            <div className="event-info-main">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <span className="partner-page-eyebrow" style={{ color: '#059669', fontSize: '0.72rem', letterSpacing: '0.08em', margin: 0 }}>
                  {language === 'vi' ? 'HOẠT ĐỘNG MỚI NHẤT' : 'LATEST ACTIVITY'}
                </span>
                {latestActivity.category && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 650, color: '#6B7280', background: '#F3F4F6', padding: '2px 8px', borderRadius: '4px' }}>
                    {latestActivity.category}
                  </span>
                )}
              </div>
              <h2 style={{ margin: '0 0 0.45rem 0' }}>
                <Link to={`/partner/activities/${latestActivity.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {latestActivity.title}
                </Link>
              </h2>
              <div className="event-meta-line">
                <span className="event-meta-item">
                  <span className="meta-icon">📅</span>
                  <span>{latestActivity.date || activeEvent.dateRange} {latestActivity.time ? `• ${latestActivity.time}` : ''}</span>
                </span>
                <span className="event-meta-item">
                  <span className="meta-icon">📍</span>
                  <span>{latestActivity.location || activeEvent.location}</span>
                </span>
                {latestActivity.eventName && (
                  <span className="event-meta-item">
                    <span className="meta-icon">🎪</span>
                    <span>{latestActivity.eventName}</span>
                  </span>
                )}
              </div>
              <div>
                {(() => {
                  const badge = getActivityStatusBadge(latestActivity.status);
                  return (
                    <span className={`status-badge ${badge.className}`}>
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="event-card-right">
            <Link to={`/partner/activities/${latestActivity.id}`} className="btn-part-secondary">
              <span>{language === 'vi' ? 'Xem chi tiết hoạt động' : 'View Activity Details'}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="partner-active-event-card">
          <div className="event-card-left">
            <img 
              src={activeEvent.imageUrl} 
              alt={activeEvent.eventTitle} 
              className="event-thumb-img"
            />
            <div className="event-info-main">
              <h2>{activeEvent.eventTitle}</h2>
              <div className="event-meta-line">
                <span className="event-meta-item">
                  <span className="meta-icon">📅</span>
                  <span>{activeEvent.dateRange}</span>
                </span>
                <span className="event-meta-item">
                  <span className="meta-icon">📍</span>
                  <span>{activeEvent.location}</span>
                </span>
              </div>
              <div>
                <span className="status-badge approved">
                  {language === 'vi' ? 'Đã được chấp thuận' : 'Approved'}
                </span>
              </div>
            </div>
          </div>

          <div className="event-card-right">
            <Link to="/partner/events" className="btn-part-secondary">
              <span>{language === 'vi' ? 'Xem chi tiết sự kiện' : 'View Event Details'}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {/* 3. Four Summary Stat Cards with Modern Icons */}
      <div className="partner-summary-grid">
        {/* Card 1: Joined Events */}
        <Link to="/partner/events" className="partner-stat-card stat-card-events">
          <div className="stat-card-top">
            <span className="stat-label-muted">{language === 'vi' ? 'Sự kiện tham gia' : 'Joined Events'}</span>
            <div className="stat-icon-wrap icon-blue"><CalendarDays size={18} /></div>
          </div>
          <div className="stat-num-box">{joinedEventsCount}</div>
          <div className="stat-card-hint">{language === 'vi' ? 'Sự kiện đã tham gia' : 'Joined events'}</div>
        </Link>

        {/* Card 2: Assigned Booths */}
        <Link to="/partner/booths" className="partner-stat-card stat-card-booths">
          <div className="stat-card-top">
            <span className="stat-label-muted">{language === 'vi' ? 'Gian hàng được phân' : 'Assigned Booths'}</span>
            <div className="stat-icon-wrap icon-green"><Store size={18} /></div>
          </div>
          <div className="stat-num-box green">{assignedBooth ? 1 : 0}</div>
          <div className="stat-card-hint">{assignedBooth ? (language === 'vi' ? `Vị trí: ${assignedBooth.code}` : `Booth: ${assignedBooth.code}`) : (language === 'vi' ? 'Chưa được phân' : 'Not assigned')}</div>
        </Link>

        {/* Card 3: Proposed Activities */}
        <Link to="/partner/activities" className="partner-stat-card stat-card-activities">
          <div className="stat-card-top">
            <span className="stat-label-muted">{language === 'vi' ? 'Hoạt động đề xuất' : 'Proposed Activities'}</span>
            <div className="stat-icon-wrap icon-gold"><Layers size={18} /></div>
          </div>
          <div className="stat-num-box gold">{proposedActivitiesCount}</div>
          <div className="stat-card-hint">{language === 'vi' ? `${activities.filter(a => a.status === 'approved').length} hoạt động đã duyệt` : `${activities.filter(a => a.status === 'approved').length} approved`}</div>
        </Link>

        {/* Card 4: Total Participants / Engagement */}
        <Link to="/partner/reports" className="partner-stat-card stat-card-reports">
          <div className="stat-card-top">
            <span className="stat-label-muted">{language === 'vi' ? 'Tổng lượt tham gia' : 'Total Participants'}</span>
            <div className="stat-icon-wrap icon-purple"><Users size={18} /></div>
          </div>
          <div className="stat-num-box">{totalEngagementCount}</div>
          <div className="stat-card-hint">{language === 'vi' ? 'Đã ghi nhận qua điểm danh' : 'Recorded check-ins'}</div>
        </Link>
      </div>

      {/* 4. To-Do Section matching Sketch Screen 1 */}
      <div className="partner-todo-section">
        <div className="todo-header-row">
          <h2 className="todo-title">
            {language === 'vi' ? 'Việc cần làm' : 'Tasks & To-Dos'}
          </h2>
          <Link to="/partner/activities" style={{ fontSize: '0.82rem', color: '#17382E', fontWeight: 700, textDecoration: 'none' }}>
            {language === 'vi' ? 'Xem tất cả →' : 'View All →'}
          </Link>
        </div>

        <div className="todo-list-items">
          {visibleTodos.map((todo) => {
            const isNeedAction = todo.status === 'need_action';
            const isPending = todo.status === 'pending_review';

            return (
              <Link key={todo.id} to={todo.link} className="todo-item-row">
                <div className="todo-item-left">
                  {isNeedAction ? (
                    <AlertCircle size={20} color="#DC2626" />
                  ) : isPending ? (
                    <Clock size={20} color="#D97706" />
                  ) : (
                    <FileText size={20} color="#6B7280" />
                  )}
                  <div>
                    <div className="todo-item-name">{todo.title}</div>
                    <div className="todo-deadline">
                      {language === 'vi' ? `Hạn: ${todo.deadline}` : `Due: ${todo.deadline}`}
                    </div>
                  </div>
                </div>

                <div>
                  <span className={`status-badge ${todo.status}`}>
                    {todo.statusLabelVi}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 5. Quick Access Action Shortcuts (Đã bỏ nút Đề xuất hoạt động mới) */}
      <div className="partner-dashboard-quick-actions">
        <Link to="/partner/events/apply" className="btn-part-secondary">
          <PlusCircle size={15} />
          <span>{language === 'vi' ? 'Đăng ký tham gia sự kiện' : 'Apply for Event'}</span>
        </Link>
        <Link to="/partner/booths/select" className="btn-part-secondary">
          <Store size={15} />
          <span>{language === 'vi' ? 'Xem sơ đồ gian hàng' : 'View Booth Map'}</span>
        </Link>
      </div>
    </div>
  );
};
