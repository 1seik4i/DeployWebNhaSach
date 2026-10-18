import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  ShieldAlert, 
  UserCheck, 
  Database, 
  KeyRound, 
  Clock, 
  ArrowRight 
} from 'lucide-react';
import { AdminNotificationItem } from '../../types/admin';

interface AdminNotificationsViewProps {
  notifications: AdminNotificationItem[];
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const AdminNotificationsView: React.FC<AdminNotificationsViewProps> = ({
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onNavigateTab
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredNotifs = notifications.filter(n => {
    if (activeCategory === 'all') return true;
    return n.category === activeCategory;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <ShieldAlert size={18} className="notif-icon-security" />;
      case 'account':
        return <UserCheck size={18} className="notif-icon-account" />;
      case 'system':
        return <Database size={18} className="notif-icon-system" />;
      default:
        return <Bell size={18} className="notif-icon-default" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'security': return 'An ninh';
      case 'account': return 'Tài khoản';
      case 'system': return 'Hệ thống';
      default: return 'Thông báo';
    }
  };

  const handleClickItem = (notif: AdminNotificationItem) => {
    if (!notif.isRead) {
      onMarkAsRead(notif.id);
    }
    if (notif.targetTab) {
      onNavigateTab(notif.targetTab);
    }
  };

  return (
    <div className="adm-notifications-view">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Thông báo Quản trị</h1>
        </div>
        <div className="adm-page-header-actions">
          {unreadCount > 0 && (
            <button className="adm-btn adm-btn-secondary" onClick={onMarkAllAsRead}>
              <CheckCheck size={16} />
              <span>Đánh dấu tất cả đã đọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="adm-card adm-notif-tabs-card">
        <div className="adm-notif-tabs">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'security', label: 'An ninh' },
            { id: 'account', label: 'Tài khoản' },
            { id: 'system', label: 'Hệ thống' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`adm-tab-pill ${activeCategory === tab.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(tab.id)}
            >
              {tab.label}
              {tab.id === 'all' && unreadCount > 0 && (
                <span className="adm-pill-count">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="adm-card adm-notif-list-card">
        {filteredNotifs.length === 0 ? (
          <div className="adm-notif-empty">
            <Bell size={36} />
            <p>Không có thông báo nào trong danh mục này.</p>
          </div>
        ) : (
          <div className="adm-notif-list">
            {filteredNotifs.map((notif) => (
              <div 
                key={notif.id}
                className={`adm-notif-item ${!notif.isRead ? 'unread' : ''}`}
                onClick={() => handleClickItem(notif)}
              >
                <div className="adm-notif-item-icon">
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="adm-notif-item-main">
                  <div className="adm-notif-item-top">
                    <span className="adm-notif-badge">{getCategoryLabel(notif.category)}</span>
                    <span className="adm-notif-time">
                      <Clock size={12} />
                      {notif.timeAgo}
                    </span>
                    {!notif.isRead && <span className="adm-notif-unread-dot"></span>}
                  </div>

                  <h4 className="adm-notif-title">{notif.title}</h4>
                  <p className="adm-notif-content">{notif.content}</p>
                </div>

                {notif.targetTab && (
                  <div className="adm-notif-arrow">
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

