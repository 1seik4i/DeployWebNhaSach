import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  Layers, 
  Store, 
  Calendar, 
  Clock, 
  AlertCircle,
  ExternalLink 
} from 'lucide-react';
import { Language, PartnerNotification } from '../../types';
import './PartnerPages.css';

interface PartnerNotificationsPageProps {
  language: Language;
  notifications: PartnerNotification[];
  onMarkAllAsRead: () => void;
  onMarkItemAsRead: (id: string) => void;
}

export const PartnerNotificationsPage: React.FC<PartnerNotificationsPageProps> = ({
  language,
  notifications,
  onMarkAllAsRead,
  onMarkItemAsRead,
}) => {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');

  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'unread') return !n.isRead;
    return true;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'activity':
        return <Layers size={18} />;
      case 'booth':
        return <Store size={18} />;
      case 'reminder':
        return <Clock size={18} />;
      case 'event':
        return <Calendar size={18} />;
      default:
        return <Bell size={18} />;
    }
  };

  return (
    <div className="partner-notifications-page">
      {/* 1. Header matching Sketch Screen 8 */}
      <div className="partner-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="partner-page-title" style={{ margin: 0 }}>
            {language === 'vi' ? 'Thông báo' : 'Notifications'}
          </h1>
          <p className="partner-page-sub">
            {language === 'vi' 
              ? 'Cập nhật phê duyệt, phản hồi gian hàng và lịch trình từ Ban Quản Lý.' 
              : 'Updates on activity approvals, booth requests, and schedule reminders.'}
          </p>
        </div>

        {/* Filter & Actions matching Sketch Screen 8 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #D5DFDC',
              fontSize: '0.84rem',
              backgroundColor: '#FFFFFF',
              color: '#172421',
              cursor: 'pointer'
            }}
          >
            <option value="all">{language === 'vi' ? 'Tất cả' : 'All'}</option>
            <option value="unread">{language === 'vi' ? 'Chưa đọc' : 'Unread'}</option>
          </select>

          <button
            type="button"
            className="btn-part-secondary"
            onClick={onMarkAllAsRead}
          >
            <CheckCheck size={15} />
            <span>{language === 'vi' ? 'Đánh dấu đã đọc' : 'Mark All as Read'}</span>
          </button>
        </div>
      </div>

      {/* 2. Notifications List Container matching Sketch Screen 8 */}
      <div className="notifications-list-container">
        {filteredNotifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#637771' }}>
            <p>{language === 'vi' ? 'Không có thông báo mới nào.' : 'No notifications found.'}</p>
          </div>
        ) : (
          filteredNotifs.map((item) => (
            <div 
              key={item.id} 
              className={`notification-row-item ${!item.isRead ? 'unread' : ''}`}
              onClick={() => {
                onMarkItemAsRead(item.id);
                if (item.link) {
                  navigate(item.link);
                }
              }}
              style={{ cursor: item.link ? 'pointer' : 'default' }}
            >
              <div className={`notif-icon-circle ${item.type}`}>
                {getNotifIcon(item.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: item.isRead ? 500 : 700, color: '#172421', lineHeight: 1.4 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: '#8C9F9A', marginTop: '0.25rem' }}>
                  {item.time}
                </div>
              </div>

              {item.link && (
                <Link 
                  to={item.link} 
                  className="btn-part-secondary" 
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', gap: '0.3rem' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{language === 'vi' ? 'Xem' : 'View'}</span>
                  <ExternalLink size={13} />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

