import { useModalBehavior } from '../../hooks/useModalBehavior';
import { BookOpen, PanelLeft, X, ChevronDown, LogOut } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import './RoleSidebar.css';

export interface RoleSidebarSubItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

export interface RoleSidebarItem {
  id: string;
  icon: ReactNode;
  label: string;
  badge?: number;
  children?: RoleSidebarSubItem[];
}

export interface RoleSidebarUserProfile {
  name: string;
  subtitle?: string;
  avatar?: string;
  onProfileClick?: () => void;
  onLogout?: () => void;
  logoutLabel?: string;
}

interface RoleSidebarProps {
  ariaLabel: string;
  roleLabel: string;
  editionLabel: string;
  items: RoleSidebarItem[];
  activeId: string;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onSelect: (id: string) => void;
  userProfile?: RoleSidebarUserProfile;
  footerExtra?: ReactNode;
}

/** Shared role navigation: collapses to an accessible icon rail on desktop and a drawer on mobile. Supports collapsible accordion groups. */
export function RoleSidebar({
  ariaLabel,
  roleLabel,
  editionLabel,
  items,
  activeId,
  isOpenMobile = false,
  onCloseMobile,
  onSelect,
  userProfile,
  footerExtra,
}: RoleSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  useModalBehavior(isOpenMobile, () => onCloseMobile?.());
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const activeGroupId = items.find(item => item.children?.some(child => child.id === activeId))?.id ?? null;

  // Auto-expand group that contains activeId so the user always sees the active tab
  useEffect(() => {
    setExpandedGroup(activeGroupId);
  }, [activeId, activeGroupId]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setCollapsed(current => !current);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const select = (id: string) => {
    onSelect(id);
    onCloseMobile?.();
  };

  const toggleGroup = (groupId: string, firstChildId?: string) => {
    if (collapsed) {
      setCollapsed(false);
      setExpandedGroup(groupId);
      if (firstChildId) {
        select(firstChildId);
      }
      return;
    }
    setExpandedGroup(current => current === groupId ? null : groupId);
  };

  return (
    <>
      {isOpenMobile && <button className="role-sidebar-backdrop" aria-label="Đóng menu" onClick={onCloseMobile} />}
      <aside className={`role-sidebar ${collapsed ? 'is-collapsed' : ''} ${isOpenMobile ? 'is-mobile-open' : ''}`} aria-label={ariaLabel}>
        <header className="role-sidebar-header">
          <button className={`role-sidebar-mark ${collapsed ? 'is-clickable' : ''}`} type="button" onClick={() => { if (collapsed) setCollapsed(false); }} aria-label={collapsed ? 'Mở rộng thanh điều hướng' : undefined} title={collapsed ? 'Mở rộng (Ctrl+B)' : undefined}>
            <BookOpen size={18} />
          </button>
          <span className="role-sidebar-heading">
            <strong>ĐƯỜNG SÁCH</strong>
            <small>{roleLabel}</small>
          </span>
          <button className="role-sidebar-toggle" type="button" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'} title="Thu gọn/mở rộng (Ctrl+B)">
            <PanelLeft size={17} />
          </button>
          <button className="role-sidebar-close" type="button" onClick={onCloseMobile} aria-label="Đóng menu"><X size={19} /></button>
        </header>

        <nav className="role-sidebar-nav" aria-label="Điều hướng chức năng">
          <p className="role-sidebar-section-label">Không gian làm việc</p>
          {items.map(item => {
            const hasChildren = item.children && item.children.length > 0;
            const isChildActive = hasChildren && item.children!.some(c => c.id === activeId);
            const isDirectActive = item.id === activeId;
            const isExpanded = expandedGroup === item.id;

            if (hasChildren) {
              const totalBadge = (item.badge || 0) + item.children!.reduce((acc, c) => acc + (c.badge || 0), 0);

              return (
                <div key={item.id} className={`role-sidebar-group ${isExpanded ? 'is-expanded' : ''} ${isChildActive ? 'has-active-child' : ''}`}>
                  <button
                    type="button"
                    className={`role-sidebar-item role-sidebar-group-btn ${isChildActive ? 'is-child-active' : ''}`}
                    onClick={() => toggleGroup(item.id, item.children![0]?.id)}
                    aria-expanded={isExpanded}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="role-sidebar-item-icon" aria-hidden="true">{item.icon}</span>
                    <span className="role-sidebar-item-label">{item.label}</span>
                    {totalBadge > 0 && <span className="role-sidebar-item-badge">{totalBadge}</span>}
                    <span className={`role-sidebar-chevron ${isExpanded ? 'is-expanded' : ''}`} aria-hidden="true">
                      <ChevronDown size={14} />
                    </span>
                  </button>

                  {/* Collapsible Sub-Items Accordion */}
                  <div className={`role-sidebar-subitems-collapse ${isExpanded && !collapsed ? 'is-open' : ''}`} inert={!isExpanded || collapsed} aria-hidden={!isExpanded || collapsed}>
                    <div className="role-sidebar-subitems" role="group" aria-label={item.label}>
                      {item.children!.map(child => {
                        const active = child.id === activeId;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            className={`role-sidebar-subitem ${active ? 'is-active' : ''}`}
                            onClick={() => select(child.id)}
                            aria-current={active ? 'page' : undefined}
                          >
                            <span className="role-sidebar-subitem-bullet" aria-hidden="true">
                              {child.icon ? child.icon : <span className="role-sidebar-subitem-dot" />}
                            </span>
                            <span className="role-sidebar-subitem-label">{child.label}</span>
                            {child.badge && child.badge > 0 ? (
                              <span className="role-sidebar-item-badge">{child.badge}</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                className={`role-sidebar-item ${isDirectActive ? 'is-active' : ''}`}
                onClick={() => select(item.id)}
                aria-current={isDirectActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span className="role-sidebar-item-icon" aria-hidden="true">{item.icon}</span>
                <span className="role-sidebar-item-label">{item.label}</span>
                {item.badge && item.badge > 0 ? <span className="role-sidebar-item-badge">{item.badge}</span> : null}
              </button>
            );
          })}
        </nav>

        {userProfile && (
          <div className="role-sidebar-user-block">
            <div 
              className={`role-sidebar-user-info ${userProfile.onProfileClick ? 'is-clickable' : ''}`}
              onClick={() => {
                if (userProfile.onProfileClick) {
                  userProfile.onProfileClick();
                  onCloseMobile?.();
                }
              }}
              role={userProfile.onProfileClick ? 'button' : undefined}
              tabIndex={userProfile.onProfileClick ? 0 : undefined}
              title={userProfile.name}
            >
              <div className="role-sidebar-user-avatar">
                {userProfile.avatar ? (
                  <img src={userProfile.avatar} alt={userProfile.name} />
                ) : (
                  <span>
                    {userProfile.name.split(/\s+/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
                  </span>
                )}
              </div>
              <div className="role-sidebar-user-details">
                <span className="role-sidebar-user-name">{userProfile.name}</span>
                {userProfile.subtitle && <span className="role-sidebar-user-sub">{userProfile.subtitle}</span>}
              </div>
            </div>

            {userProfile.onLogout && (
              <button
                type="button"
                className="role-sidebar-logout-btn"
                onClick={() => {
                  userProfile.onLogout?.();
                  onCloseMobile?.();
                }}
                title={userProfile.logoutLabel || 'Đăng xuất'}
                aria-label={userProfile.logoutLabel || 'Đăng xuất'}
              >
                <LogOut size={16} />
                <span className="role-sidebar-logout-label">{userProfile.logoutLabel || 'Đăng xuất'}</span>
              </button>
            )}
          </div>
        )}

        {footerExtra}

        <footer className="role-sidebar-footer">
          <span>{editionLabel}</span>
          <small>Ctrl + B để thu gọn</small>
        </footer>
      </aside>
    </>
  );
}
