import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Menu, 
  ChevronDown, 
  User, 
  LogOut, 
  BookOpen, 
  ShieldCheck,
  CheckCheck,
  Shield,
  Clock
} from 'lucide-react';
import { Language } from '../../types';
import { AdminProfile, AdminNotificationItem } from '../../types/admin';

interface AdminTopBarProps {
  language: Language;
  profile: AdminProfile;
  unreadCount: number;
  notifications?: AdminNotificationItem[];
  onMarkAllNotifsRead?: () => void;
  onMarkNotifRead?: (id: string) => void;
  onOpenNotifications: () => void;
  onNavigateTab?: (tab: string) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  language,
  profile,
  unreadCount,
  notifications = [],
  onMarkAllNotifsRead,
  onMarkNotifRead,
  onOpenNotifications,
  onNavigateTab,
  onOpenProfile,
  onLogout,
  onOpenMobileMenu
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const latestNotifs = notifications.slice(0, 4);

  return (
    <header className="admin-topbar">
      {/* 1. Left: Brand Logo & Mobile Toggle */}
      <div className="admin-topbar-left">
        <button
          type="button"
          className="admin-mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Mở menu quản trị"
        >
          <Menu size={20} />
        </button>

        <div className="admin-brand">
          <div className="admin-brand-icon" style={{ padding: '2px', background: '#FFFFFF', borderRadius: '50%', overflow: 'hidden' }}>
            <img src="/duong_sach_logo.png" alt="Logo Đường Sách TP.HCM" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          </div>
          <div className="admin-brand-text">
            <span className="brand-main">ĐƯỜNG SÁCH</span>
            <span className="brand-sub">TP.HCM • ADMIN</span>
          </div>
        </div>
      </div>

      {/* 2. Right: Quick Search, Bell, User Capsule */}
      <div className="admin-topbar-right">
        {/* Global Quick Search Bar */}
        <form className="admin-top-search" onSubmit={handleSearchSubmit}>
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder={language === 'vi' ? 'Tìm tài khoản, phân quyền, cấu hình...' : 'Search users, roles, settings...'} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Notifications Bell Dropdown */}
        <div style={{ position: 'relative' }} ref={notifDropdownRef}>
          <button
            type="button"
            className={`admin-icon-button ${notifDropdownOpen ? 'is-active' : ''}`}
            onClick={() => {
              setNotifDropdownOpen(!notifDropdownOpen);
              setDropdownOpen(false);
            }}
            aria-label="Xem thông báo hệ thống"
            title={language === 'vi' ? 'Thông báo quản trị' : 'Admin notifications'}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="admin-badge-dot"></span>}
          </button>

          {notifDropdownOpen && (
            <div className="partner-notif-dropdown-popover" style={{ right: '-50px', width: '380px' }}>
              <div className="notif-dropdown-header">
                <strong className="notif-header-title-text">{language === 'vi' ? 'Thông báo mới nhất' : 'Admin Notifications'}</strong>
                <div className="notif-header-center">
                  {unreadCount > 0 && (
                    <span className="notif-unread-badge">
                      {unreadCount} {language === 'vi' ? 'mới' : 'new'}
                    </span>
                  )}
                </div>
                <div className="notif-header-right">
                  {unreadCount > 0 && onMarkAllNotifsRead ? (
                    <button 
                      type="button"
                      className="notif-mark-read-btn"
                      onClick={() => onMarkAllNotifsRead()}
                    >
                      {language === 'vi' ? 'Đã đọc tất cả' : 'Mark all read'}
                    </button>
                  ) : (
                    <span style={{ width: '60px' }}></span>
                  )}
                </div>
              </div>

              <div className="notif-dropdown-list">
                {latestNotifs.length === 0 ? (
                  <div className="notif-dropdown-empty">
                    <Bell size={24} style={{ opacity: 0.4, marginBottom: '0.4rem' }} />
                    <p>{language === 'vi' ? 'Không có thông báo mới nào' : 'No notifications'}</p>
                  </div>
                ) : (
                  latestNotifs.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`notif-dropdown-item ${!notif.isRead ? 'unread' : ''}`}
                      onClick={() => {
                        if (!notif.isRead && onMarkNotifRead) {
                          onMarkNotifRead(notif.id);
                        }
                        setNotifDropdownOpen(false);
                        if (notif.targetTab && onNavigateTab) {
                          onNavigateTab(notif.targetTab);
                        } else {
                          onOpenNotifications();
                        }
                      }}
                    >
                      <div className="notif-item-indicator">
                        {!notif.isRead && <span className="notif-blue-dot"></span>}
                      </div>
                      <div className="notif-item-content">
                        <h4 className="notif-item-title">{notif.title}</h4>
                        <p className="notif-item-desc">{notif.content}</p>
                        <span className="notif-item-time">{notif.timeAgo}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="notif-dropdown-footer">
                <button 
                  type="button"
                  className="notif-view-all-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => {
                    setNotifDropdownOpen(false);
                    onOpenNotifications();
                  }}
                >
                  {language === 'vi' ? 'Xem tất cả thông báo hệ thống →' : 'View all admin notifications →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Capsule Pill */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <div 
            className="admin-user-capsule"
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotifDropdownOpen(false);
            }}
            role="button"
            tabIndex={0}
          >
            <div className="admin-avatar-circle" style={{ overflow: 'hidden' }}>
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.name} 
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                />
              ) : (
                profile.avatarInitials
              )}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{profile.name}</span>
              <span className="admin-user-role">System Admin</span>
            </div>
            <ChevronDown size={14} color="rgba(255, 255, 255, 0.5)" style={{ marginLeft: '0.2rem' }} />
          </div>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: '240px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.25)',
              padding: '0.65rem',
              zIndex: 200,
              animation: 'admModalIn 0.15s ease-out'
            }}>
              <div style={{ padding: '0.5rem 0.65rem', borderBottom: '1px solid #EEF2F0', marginBottom: '0.35rem' }}>
                <strong style={{ display: 'block', fontSize: '0.86rem', color: '#172421' }}>{profile.name}</strong>
                <span style={{ fontSize: '0.74rem', color: '#6C7D78' }}>{profile.email}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenProfile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  background: 'none',
                  border: 'none',
                  color: '#243833',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '7px',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F4F7F5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <User size={15} color="#556B65" />
                <span>{language === 'vi' ? 'Hồ sơ Quản trị viên' : 'Admin Profile'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '7px',
                  textAlign: 'left',
                  marginTop: '0.25rem'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEECEB')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LogOut size={15} />
                <span>{language === 'vi' ? 'Đăng xuất' : 'Sign Out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

