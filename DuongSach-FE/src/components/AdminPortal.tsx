import { promptModal } from '../services/notificationModal';
import React, { useState, useEffect } from 'react';
import { FacilityManagementView } from './admin/FacilityManagementView';
import { Language } from '../types';
import { 
  AdminTab, 
  AdminSidebar 
} from './admin/AdminSidebar';
import { AdminTopBar } from './admin/AdminTopBar';
import { AdminDashboardView } from './admin/AdminDashboardView';
import { AdminTrafficView } from './admin/AdminTrafficView';
import { AdminUserManagementView } from './admin/AdminUserManagementView';
import { AdminRolesPermissionsView } from './admin/AdminRolesPermissionsView';
import { AdminSystemSettingsView } from './admin/AdminSystemSettingsView';
import { AdminNotificationsView } from './admin/AdminNotificationsView';
import { AdminProfileView } from './admin/AdminProfileView';
import { AdminDigitalLibraryView } from './admin/AdminDigitalLibraryView';
import { AdminLandingEditorView } from './admin/AdminLandingEditorView';
import { AdminNewsManagementView } from './admin/AdminNewsManagementView';
import { AdminAuditLogsView } from './admin/AdminAuditLogsView';
import { AdminEventApplicationsView } from './admin/AdminEventApplicationsView';
import { AdminEventSuggestionsView } from './admin/AdminEventSuggestionsView';

// Merged Management Portal Views
import { EventManagementView } from './portal/EventManagementView';
import { EventDetailView } from './portal/EventDetailView';
import { BoothMapView } from './portal/BoothMapView';
import { ActivityManagementView } from './portal/ActivityManagementView';
import { OrganizerReportsView } from './portal/OrganizerReportsView';
import { OrganizerFeedbackView } from './portal/OrganizerFeedbackView';
import { OrganizerCreateActivityModal } from './portal/OrganizerCreateActivityModal';

import {
  AdminUserAccount,
  AdminRoleType,
  AdminRolePermissionConfig,
  AdminSystemSettings,
  AdminAuditLogItem,
  AdminNotificationItem,
  AdminProfile,
  AdminPermissionItem
} from '../types/admin';
import {
  OrganizerEvent,
  OrganizerBoothItem,
  OrganizerActivityItem
} from '../types/organizer';
import {
  adminApi,
  resolveAdminNotificationTargetTab,
  AdminDashboardStats,
} from '../services/adminApi';
import { organizerApi, OrganizerPartnerApplication } from '../services/organizerApi';
import { OrganizerActivityProposal } from '../types/organizer';

import './admin/AdminPortal.css';
import './portal/OrganizerPortal.css';

export interface AdminPortalProps {
  language: Language;
  onLogout: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  language,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    return tab === 'traffic' || tab === 'event-applications' || tab === 'event-suggestions' ? tab : 'dashboard';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core Admin Data States
  const [users, setUsers] = useState<AdminUserAccount[]>([]);
  const [roleConfigs, setRoleConfigs] = useState<Record<AdminRoleType, AdminRolePermissionConfig>>({} as Record<AdminRoleType, AdminRolePermissionConfig>);
  const [permissions, setPermissions] = useState<AdminPermissionItem[]>([]);
  const [systemSettings, setSystemSettings] = useState<AdminSystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogItem[]>([]);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [profile, setProfile] = useState<AdminProfile>({ id: '', name: '', role: '', department: '', email: '', phone: '', avatarInitials: '', lastLogin: '' });
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats>({ userCount: 0, eventCount: 0, openEventCount: 0, boothCount: 0, activityCount: 0, todayActivityCount: 0, usersByRole: {}, auditByDay: [] });
  const [loadError, setLoadError] = useState('');

  // Merged Management Data States
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventsList, setEventsList] = useState<OrganizerEvent[]>([]);
  const [boothsList, setBoothsList] = useState<OrganizerBoothItem[]>([]);
  const [activitiesList, setActivitiesList] = useState<OrganizerActivityItem[]>([]);
  const [partnerApplications, setPartnerApplications] = useState<OrganizerPartnerApplication[]>([]);
  const [activityProposals, setActivityProposals] = useState<OrganizerActivityProposal[]>([]);
  const [eventLocations, setEventLocations] = useState<Array<{ id: string; name: string; capacity: number }>>([]);

  // Modals
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);

  const refreshAdminData = async () => {
    try {
      const [
        loadedStats,
        loadedUsers,
        loadedRoles,
        loadedPermissions,
        loadedSettings,
        loadedAudit,
        loadedNotifs,
        loadedProfile,
        loadedEvents
      ] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getUsers(),
        adminApi.getRoles(),
        adminApi.getPermissions(),
        adminApi.getSettings(),
        adminApi.getAuditLogs(),
        adminApi.getNotifications(),
        adminApi.getProfile(),
        organizerApi.getEvents()
      ]);
      setDashboardStats(loadedStats);
      setUsers(loadedUsers);
      setRoleConfigs(loadedRoles);
      setPermissions(loadedPermissions);
      setSystemSettings(loadedSettings);
      setAuditLogs(loadedAudit);
      setNotifications(loadedNotifs);
      setProfile(loadedProfile);
      setEventsList(loadedEvents);
      setLoadError('');

      const targetEventId = selectedEventId || undefined;
      {
        const [booths, activities, locations, applications, proposals] = await Promise.all([
          organizerApi.getBooths(targetEventId),
          organizerApi.getActivities(targetEventId),
          organizerApi.getEventLocations(targetEventId),
          organizerApi.getPartnerApplications(targetEventId),
          organizerApi.getProposals(targetEventId)
        ]);
        setBoothsList(booths);
        setActivitiesList(activities);
        setEventLocations(locations);
        setPartnerApplications(applications);
        setActivityProposals(proposals);
      }
    } catch (error) {
      console.warn(error);
      setLoadError(error instanceof Error ? error.message : 'Không tải được dữ liệu quản trị');
    }
  };

  useEffect(() => {
    void refreshAdminData();
    const refresh = () => void refreshAdminData().catch(console.warn);
    const intervalId = window.setInterval(refresh, 20000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(intervalId); window.removeEventListener('focus', refresh); };
  }, [selectedEventId]);

  // --- Handlers: User Management ---
  const handleAddUser = async (newUserData: Parameters<typeof adminApi.createUser>[0]) => {
    await adminApi.createUser(newUserData);
    await refreshAdminData();
  };

  const handleUpdateUser = async (id: string, updates: Partial<AdminUserAccount>) => {
    await adminApi.updateUser(id, { fullName: updates.fullName, phone: updates.phone, role: updates.role, status: updates.status });
    await refreshAdminData();
  };

  const handleToggleLock = async (id: string, reason?: string) => {
    const user = users.find(item => item.id === id);
    if (!user) return;
    await adminApi.updateUserStatus(id, user.status === 'locked' ? 'active' : 'locked', reason);
    await refreshAdminData();
  };

  const handleResetPassword = async (user: AdminUserAccount) => {
    await adminApi.resetPassword(user.id);
    await refreshAdminData();
  };

  // --- Handlers: Roles & Permissions ---
  const handleSaveRolePermissions = async (roleId: AdminRoleType, permissionCodes: string[]) => {
    await adminApi.saveRolePermissions(roleId, permissionCodes);
    await refreshAdminData();
  };

  const handleResetRoleDefaults = async (_roleId: AdminRoleType) => {
    setRoleConfigs(await adminApi.getRoles());
  };

  // --- Handlers: System Settings ---
  const handleSaveSettings = async (newSettings: AdminSystemSettings) => {
    await adminApi.saveSettings(newSettings);
    await refreshAdminData();
  };

  const handleResetSettings = async () => {
    setSystemSettings(await adminApi.getSettings());
  };

  // --- Handlers: Notifications ---
  const handleMarkAllNotifsAsRead = async () => {
    await adminApi.markAllNotificationsRead();
    setNotifications(await adminApi.getNotifications());
  };

  const handleMarkNotifAsRead = async (id: string) => {
    await adminApi.markNotificationRead(id);
    setNotifications(await adminApi.getNotifications());
  };

  // --- Handlers: Profile ---
  const handleUpdateProfile = async (updates: Partial<AdminProfile>) => {
    await adminApi.updateProfile({ fullName: updates.name, email: updates.email, phone: updates.phone, avatarUrl: updates.avatarUrl, department: updates.department });
    setProfile(await adminApi.getProfile());
  };

  // --- Handlers: Event & Activity Management ---
  const handleTogglePublishEvent = async (eventId: string) => {
    const target = eventsList.find(e => e.id === eventId);
    if (!target) return;
    if (target.status === 'draft') await organizerApi.publishEvent(eventId);
    else await organizerApi.unpublishEvent(eventId);
    await refreshAdminData();
  };

  const handleUpdateEventSettings = async (eventId: string, settings: Partial<OrganizerEvent>) => {
    await organizerApi.updateEventSettings(eventId, {
      boothDeadline: settings.boothDeadline,
      activityDeadline: settings.activityDeadline,
      participantDeadline: settings.participantDeadline,
      cancellationCutoff: settings.cancellationCutoff,
    });
    await refreshAdminData();
  };

  const handleBroadcastEvent = async (eventId: string) => {
    const message = await promptModal('Nhập nội dung thông báo gửi tới người tham gia và đối tác:');
    if (!message?.trim()) return;
    try {
      setLoadError('');
      await organizerApi.broadcastEvent(eventId, message.trim());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Không thể gửi thông báo.');
    }
  };

  const handleCreateActivity = async (activityData: OrganizerActivityItem) => {
    const eventId = activityData.eventId || selectedEventId;
    if (!eventId) throw new Error('Vui lòng chọn sự kiện để đăng ký hoạt động.');
    const [day, month, year] = activityData.dateStr.split('/');
    const [startTime, endTime] = activityData.timeStr.split('–').map(value => value.trim());
    await organizerApi.createActivity({
      eventId,
      title: activityData.title,
      kind: activityData.type,
      locationId: activityData.location,
      startAt: `${year}-${month}-${day}T${startTime}:00+07:00`,
      endAt: `${year}-${month}-${day}T${endTime}:00+07:00`,
      capacity: activityData.capacity,
      description: activityData.description,
      speaker: activityData.speaker,
      imageUrl: activityData.thumbnail || undefined,
    });
    await refreshAdminData();
    setIsCreateActivityOpen(false);
  };

  const currentSelectedEvent = eventsList.find(e => e.id === selectedEventId) || eventsList[0] || null;
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="admin-app-shell">
      {/* 1. Full-Width Top Header */}
      <AdminTopBar
        language={language}
        profile={profile}
        unreadCount={unreadNotificationsCount}
        notifications={notifications}
        onMarkAllNotifsRead={handleMarkAllNotifsAsRead}
        onMarkNotifRead={handleMarkNotifAsRead}
        onOpenNotifications={() => setActiveTab('notifications')}
        onNavigateTab={(tab) => {
          const target = resolveAdminNotificationTargetTab({ link: tab });
          setActiveTab(target as AdminTab);
        }}
        onOpenProfile={() => setActiveTab('profile')}
        onLogout={onLogout}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* 2. Body container with sticky sidebar + main content */}
      <div className="admin-body-container">
        {/* Sticky Sidebar */}
        <AdminSidebar
          language={language}
          activeTab={activeTab}
          onSelectTab={(tab: AdminTab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          unreadNotificationsCount={unreadNotificationsCount}
          onLogout={onLogout}
          profile={profile}
          onOpenProfile={() => setActiveTab('profile')}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Viewport */}
        <main className={`admin-main-viewport ${
          activeTab === 'landing-editor' ||
          activeTab === 'landing-journey' ||
          activeTab === 'landing-org'
            ? 'is-full-width-editor'
            : ''
        }`}>
          {loadError && <p className="app-loading-state" role="status">{loadError}</p>}
          
          {activeTab === 'traffic' && <AdminTrafficView language={language} />}
          {activeTab === 'dashboard' && (
            <AdminDashboardView
              stats={dashboardStats}
              onNavigateTab={(tab) => setActiveTab(tab as AdminTab)}
              auditLogs={auditLogs}
              users={users}
              onOpenAddUser={() => setActiveTab('users')}
            />
          )}

          {(activeTab === 'landing-editor' ||
            activeTab === 'landing-journey' ||
            activeTab === 'landing-org') && (
            <AdminLandingEditorView
              language={language}
              initialSubTab={
                activeTab === 'landing-org'
                  ? 'organization'
                  : 'journey'
              }
              onSubTabChange={(subTab) => {
                if (subTab === 'journey') {
                  setActiveTab('landing-journey');
                } else if (subTab === 'news') {
                  setActiveTab('landing-news');
                } else if (subTab === 'organization') {
                  setActiveTab('landing-org');
                }
              }}
            />
          )}

          {activeTab === 'landing-news' && (
            <AdminNewsManagementView language={language} />
          )}

          {activeTab === 'events' && (
            selectedEventId && currentSelectedEvent ? (
              <EventDetailView
                language={language}
                event={currentSelectedEvent}
                activities={activitiesList}
                booths={boothsList}
                locations={eventLocations}
                partnerApplications={partnerApplications}
                onApprovePartnerApplication={async (id) => { await organizerApi.approvePartnerApplication(id); await refreshAdminData(); }}
                onRejectPartnerApplication={async (id, note) => { await organizerApi.rejectPartnerApplication(id, note); await refreshAdminData(); }}
                onCreateActivity={handleCreateActivity}
                onUpdateActivity={async (id, data) => { await organizerApi.updateActivity(id, data); await refreshAdminData(); }}
                onDeleteActivity={async (id) => { await organizerApi.deleteActivity(id); await refreshAdminData(); }}
                onBack={() => setSelectedEventId(null)}
                onNavigateToBoothsMap={() => setActiveTab('booth-map')}
                onNavigateToReports={() => setActiveTab('reports')}
                onUpdateEventSettings={handleUpdateEventSettings}
                onTogglePublishEvent={handleTogglePublishEvent}
                onBroadcastEvent={handleBroadcastEvent}
              />
            ) : (
              <EventManagementView
                language={language}
                events={eventsList}
                onSelectEvent={(eventId) => setSelectedEventId(eventId)}
                onOpenCreateEvent={() => setIsCreateActivityOpen(true)}
                onTogglePublishEvent={handleTogglePublishEvent}
              />
            )
          )}

          {activeTab === 'activities' && (
            <ActivityManagementView
              language={language}
              activities={activitiesList}
              proposals={activityProposals}
              events={eventsList}
              selectedEventId={selectedEventId || ''}
              onSelectEventId={(id) => setSelectedEventId(id || null)}
              onPublishActivity={async (id) => { await organizerApi.publishActivity(id); await refreshAdminData(); }}
              onOpenCreateActivity={() => setIsCreateActivityOpen(true)}
              onDeleteActivity={async (id) => { await organizerApi.deleteActivity(id); await refreshAdminData(); }}
              onDeleteProposal={async (id) => { await organizerApi.deleteProposal(id); await refreshAdminData(); }}
              onApproveProposal={async (id) => { await organizerApi.approveProposal(id); await refreshAdminData(); }}
              onRejectProposal={async (id, note) => { await organizerApi.rejectProposal(id, note); await refreshAdminData(); }}
              onRequestProposalSupplement={async (id, note) => { await organizerApi.requestProposalSupplement(id, note); await refreshAdminData(); }}
            />
          )}

          {activeTab === 'booth-map' && (
            <BoothMapView
              language={language}
              booths={boothsList}
              events={eventsList}
              selectedEventId={selectedEventId || ''}
              onSelectEventId={(id) => setSelectedEventId(id)}
            />
          )}

          {activeTab === 'venues' && <FacilityManagementView key="locations" kind="locations" />}
          {activeTab === 'assets' && <FacilityManagementView key="assets" kind="assets" />}
          {activeTab === 'booths' && <FacilityManagementView key="booths" kind="booths" />}
          {activeTab === 'library' && <AdminDigitalLibraryView language={language} />}
          
          {activeTab === 'reports' && (
            <OrganizerReportsView
              language={language}
              events={eventsList}
              selectedEventId={selectedEventId || ''}
              onSelectEventId={(id) => setSelectedEventId(id)}
            />
          )}

          {activeTab === 'feedback' && (
            <OrganizerFeedbackView language={language} />
          )}

          {activeTab === 'event-applications' && <AdminEventApplicationsView language={language} />}
          {activeTab === 'event-suggestions' && <AdminEventSuggestionsView language={language} />}

          {activeTab === 'users' && (
            <AdminUserManagementView
              users={users}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onToggleLock={handleToggleLock}
              onResetPassword={handleResetPassword}
            />
          )}

          {activeTab === 'roles' && (
            <AdminRolesPermissionsView
              roleConfigs={roleConfigs}
              permissions={permissions}
              onSaveRolePermissions={handleSaveRolePermissions}
              onResetDefaults={handleResetRoleDefaults}
            />
          )}

          {activeTab === 'settings' && (
            systemSettings ? (
              <AdminSystemSettingsView
                settings={systemSettings}
                onSaveSettings={handleSaveSettings}
                onResetSettings={handleResetSettings}
              />
            ) : <div className="app-loading-state">Đang tải cấu hình hệ thống từ cơ sở dữ liệu…</div>
          )}

          {activeTab === 'notifications' && (
            <AdminNotificationsView
              notifications={notifications}
              onMarkAllAsRead={handleMarkAllNotifsAsRead}
              onMarkAsRead={handleMarkNotifAsRead}
              onNavigateTab={(tab) => {
                const target = resolveAdminNotificationTargetTab({ link: tab });
                setActiveTab(target as AdminTab);
              }}
            />
          )}

          {activeTab === 'audit' && (
            <AdminAuditLogsView logs={auditLogs} />
          )}

          {activeTab === 'profile' && (
            <AdminProfileView
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onChangePassword={adminApi.changePassword}
              onLogout={onLogout}
            />
          )}
        </main>
      </div>

      {/* Merged Management Modals */}
      <OrganizerCreateActivityModal
        language={language}
        isOpen={isCreateActivityOpen}
        locations={eventLocations}
        events={eventsList}
        onClose={() => setIsCreateActivityOpen(false)}
        onCreateActivity={handleCreateActivity}
      />

    </div>
  );
};

export default AdminPortal;
