import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { PublicEntityDetail } from './pages/PublicEntityDetail';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BoothsSection } from './components/BoothsSection';
import { EventsSection } from './components/EventsSection';

import { DigitalLibrarySection } from './components/library/DigitalLibrarySection';
import { InteractiveMap } from './components/InteractiveMap';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import { BoothsExperience } from './pages/BoothsExperience';
import { EventsExperience } from './pages/EventsExperience';
import { NewsExperience } from './pages/NewsExperience';
import { JourneyExperience } from './pages/JourneyExperience';
import { OrganizationExperience } from './pages/OrganizationExperience';
import { ContactExperience } from './pages/ContactExperience';
import { DigitalLibraryPage } from './pages/DigitalLibraryPage';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { Footer } from './components/Footer';
import { PartnerLayout } from './pages/partner/PartnerLayout';
import { PartnerLoginPage } from './pages/partner/PartnerLoginPage';
import { PartnerDashboard } from './pages/partner/PartnerDashboard';
import { EventApplicationPage } from './pages/partner/EventApplicationPage';
import { BoothSelectionPage } from './pages/partner/BoothSelectionPage';
import { BoothManagementPage } from './pages/partner/BoothManagementPage';
import { UnassignedBoothPage } from './pages/partner/UnassignedBoothPage';
import { ActivityProposalPage } from './pages/partner/ActivityProposalPage';
import { PartnerActivityDetailPage } from './pages/partner/PartnerActivityDetailPage';
import { PartnerReportsPage } from './pages/partner/PartnerReportsPage';
import { PartnerNotificationsPage } from './pages/partner/PartnerNotificationsPage';
import { PartnerProfilePage } from './pages/partner/PartnerProfilePage';
import { PartnerBookSalesPage } from './pages/partner/PartnerBookSalesPage';
import { ActivityAttendanceModal } from './pages/partner/ActivityAttendanceModal';
import { AdminPortal } from './components/AdminPortal';
import { AdminLoginPage, ADMIN_SESSION_KEY } from './pages/admin/AdminLoginPage';
import {
  Language, EventItem, Booth, PartnerOrganization, PartnerEventApplication,
  PartnerBooth, PartnerActivityProposal, PartnerTodoItem, PartnerNotification,
  PartnerReportStats, AttendanceScanRecord
} from './types';
import { partnerApi } from './services/partnerApi';
import { publicApi } from './services/publicApi';
import './App.css';
import './landing-responsive.css';

const storedSessionRole = (): string => {
  try {
    const raw = sessionStorage.getItem('duongsach_user');
    return raw ? String(JSON.parse(raw).primaryRole || '') : '';
  } catch {
    return '';
  }
};

const hasAccessToken = () => Boolean(sessionStorage.getItem('duongsach_token'));

export function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const landingScrollPositionRef = useRef<number | null>(null);
  const isBooths = /^\/(?:gian-hang|booths)(?:\/|$)/.test(location.pathname);
  const isEvents = /^\/(?:su-kien|events)(?:\/|$)/.test(location.pathname);
  const isNews = /^\/(?:tin-tuc|tin-tuc-su-kien|news)(?:\/|$)/.test(location.pathname);
  const isJourney = /^\/(?:hanh-trinh|journey)(?:\/|$)/.test(location.pathname);
  const isOrganization = /^\/(?:bo-may-to-chuc|organization)(?:\/|$)/.test(location.pathname);
  const isContact = /^\/(?:lien-he|contact)(?:\/|$)/.test(location.pathname);
  const isLibrary = /^\/(?:thu-vien-so|library)(?:\/|$)/.test(location.pathname);
  const isAdminRoute = /^\/admin(?:\/|$)/.test(location.pathname);
  const isPartnerRoute = /^\/partner(?:\/|$)/.test(location.pathname);
  const isSlidePageOpen = isBooths || isEvents || isNews || isJourney || isOrganization || isContact;
  const isPortalRoute = location.pathname === '/portal' || location.pathname === '/organizer';
  const isParticipantRoute = location.pathname.startsWith('/participant');
  const PARTNER_SESSION_KEY = 'duongsach_partner_auth_v1';
  const [isPartnerAuthenticated, setIsPartnerAuthenticated] = useState<boolean>(() => {
    return hasAccessToken() && storedSessionRole() === 'partner';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return hasAccessToken() && storedSessionRole() === 'admin';
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAdminAuthenticated(false);
      setIsPartnerAuthenticated(false);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const [partnerOrg, setPartnerOrg] = useState<PartnerOrganization | null>(null);
  const [partnerApp, setPartnerApp] = useState<PartnerEventApplication | null>(null);
  const [partnerBooths, setPartnerBooths] = useState<PartnerBooth[]>([]);
  const [partnerEventLocations, setPartnerEventLocations] = useState<Array<{ id: string; name: string; capacity: number }>>([]);
  const [partnerAssets, setPartnerAssets] = useState<Array<{ id: string; name: string; totalQuantity: number }>>([]);
  const [partnerActivities, setPartnerActivities] = useState<PartnerActivityProposal[]>([]);
  const [partnerTodos, setPartnerTodos] = useState<PartnerTodoItem[]>([]);
  const [partnerNotifications, setPartnerNotifications] = useState<PartnerNotification[]>([]);
  const [partnerReports, setPartnerReports] = useState<PartnerReportStats | null>(null);
  const [partnerLoadError, setPartnerLoadError] = useState('');
  const [attendanceScans, setAttendanceScans] = useState<AttendanceScanRecord[]>([]);
  const [activeAttendanceActivityId, setActiveAttendanceActivityId] = useState<string | null>(null);
  const [dataRevision, setDataRevision] = useState(0);

  useEffect(() => {
    if (!isPartnerAuthenticated) return;
    const refresh = () => setDataRevision(value => value + 1);
    window.addEventListener('focus', refresh);
    window.addEventListener('duongsach:data-changed', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('duongsach:data-changed', refresh);
    };
  }, [isPartnerAuthenticated]);


  const [language, setLanguage] = useState<Language>('vi');
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const [highlightedBoothId, setHighlightedBoothId] = useState<string | null>(null);
  const [focusedBoothId, setFocusedBoothId] = useState<string | null>(null);
  const [boothSearchQuery, setBoothSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return;

    const previousMode = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previousMode;
    };
  }, []);

  useLayoutEffect(() => {
    if (!isBooths && !isEvents) return;
    if (landingScrollPositionRef.current !== null) return;

    landingScrollPositionRef.current = window.scrollY;
  }, [isBooths, isEvents]);

  useEffect(() => {
    if (isSlidePageOpen || isPortalRoute || location.pathname !== '/' || location.hash) return;

    const savedScrollPosition = landingScrollPositionRef.current;
    const scrollTarget = savedScrollPosition ?? 0;
    const restoreScrollPosition = () => window.scrollTo({ top: scrollTarget, left: 0, behavior: 'auto' });

    restoreScrollPosition();
    const frameId = requestAnimationFrame(restoreScrollPosition);
    const timeoutId = window.setTimeout(restoreScrollPosition, 80);
    landingScrollPositionRef.current = null;

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [location.key, location.hash, location.pathname, isSlidePageOpen, isPortalRoute]);

  useEffect(() => {
    if (isSlidePageOpen || isPortalRoute || !location.hash) return;
    const targetId = location.hash.slice(1);
    const scrollToTarget = () => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    const frame = requestAnimationFrame(scrollToTarget);
    const timeout = setTimeout(scrollToTarget, 100);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [location.key, location.hash, isSlidePageOpen, isPortalRoute]);

  const [booths, setBooths] = useState<Booth[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isPublicDataLoading, setIsPublicDataLoading] = useState<boolean>(true);
  const [publicDataError, setPublicDataError] = useState('');

  // Load real data from Backend REST API
  useEffect(() => {
    let isInitial = true;
    const refreshPublicData = () => {
      if (isInitial) setIsPublicDataLoading(true);
      setPublicDataError('');
      Promise.all([publicApi.getEvents(), publicApi.getBooths()]).then(([eventRows, boothRows]) => {
        setEvents(eventRows);
        setBooths(boothRows);
      }).catch(error => {
        setPublicDataError(error instanceof Error ? error.message : 'Không thể tải dữ liệu từ máy chủ.');
      }).finally(() => {
        if (isInitial) {
          setIsPublicDataLoading(false);
          isInitial = false;
        }
      });
    };
    refreshPublicData();
    window.addEventListener('focus', refreshPublicData);
    window.addEventListener('duongsach:data-changed', refreshPublicData);
    return () => {
      window.removeEventListener('focus', refreshPublicData);
      window.removeEventListener('duongsach:data-changed', refreshPublicData);
    };
  }, []);

  useEffect(() => {
    if (!isPartnerAuthenticated || !isPartnerRoute) return;
    let cancelled = false;
    const load = async () => {
      try {
        setPartnerLoadError('');
        const [org, apps, assets, todos, notifs] = await Promise.all([
          partnerApi.getProfile(), partnerApi.getApplications(), partnerApi.getAssets(),
          partnerApi.getTodos(), partnerApi.getNotifications(),
        ]);
        const activeApp = apps.find(item => item.status === 'approved') || apps[0] || null;
        const eventId = activeApp?.eventId;
        const [booths, locations, activities, reports] = await Promise.all([
          partnerApi.getBooths(eventId),
          partnerApi.getEventLocations(eventId),
          partnerApi.getActivityProposals(),
          partnerApi.getReports(eventId),
        ]);
        if (cancelled) return;
        setPartnerOrg(org);
        setPartnerApp(activeApp);
        setPartnerBooths(booths);
        setPartnerEventLocations(locations);
        setPartnerAssets(assets);
        setPartnerActivities(activities);
        setPartnerTodos(todos);
        setPartnerNotifications(notifs);
        setPartnerReports(reports);
      } catch (error) {
        if (!cancelled) setPartnerLoadError(error instanceof Error ? error.message : 'Không thể tải dữ liệu đối tác từ máy chủ.');
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [isPartnerAuthenticated, isPartnerRoute, dataRevision]);


  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHeroSearch = (query: string) => {
    const normalized = query.trim().toLowerCase();
    const matchesBooth = booths.some(booth => [booth.name, booth.nameEn, booth.publisher, booth.code]
      .some(value => value.toLowerCase().includes(normalized)));
    if (!matchesBooth && normalized) {
      navigate(`/thu-vien-so?search=${encodeURIComponent(query.trim())}`);
      return;
    }
    setBoothSearchQuery(query);
    scrollToSection('gian-hang');
  };

  const handleSelectBoothOnMap = (boothId: string) => {
    setHighlightedBoothId(boothId);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const map = document.querySelector<HTMLElement>('#ban-do .illustrated-map');
      (map || document.getElementById('ban-do'))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
  };

  const handleNavigateToBoothDetail = (boothId: string) => {
    setFocusedBoothId(boothId);
    const targetEl = document.getElementById(`booth-card-${boothId}`) || document.getElementById('gian-hang');
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      setFocusedBoothId(null);
    }, 1200);
  };

  if (isPortalRoute) {
    return <Navigate to="/admin" replace />;
  }

  if (isParticipantRoute || location.pathname === '/register') {
    return <Navigate to="/" replace />;
  }

  if (location.pathname === '/login') {
    return <LoginPage language={language} />;
  }
  if (location.pathname === '/reset-password') {
    return <ResetPasswordPage language={language} />;
  }
  if (location.pathname.startsWith('/thong-tin/')) return <PublicEntityDetail />;

  // --- Partner Handlers ---
  const handleSelectPartnerBooth = async (boothId: string) => {
    if (!partnerOrg || !partnerApp) return;
    await partnerApi.requestBooth({ eventId: partnerApp.eventId, boothId });
    setPartnerBooths(await partnerApi.getBooths());
  };

  const handleAddPartnerActivity = async (newAct: Omit<PartnerActivityProposal, 'id'>) => {
    const [day, month, year] = newAct.date.split('/');
    const [startTime, endTime] = newAct.time.split('–').map(value => value.trim());
    const kindByCategory: Record<string, string> = {
      Workshop: 'workshop', workshop: 'workshop',
      Talkshow: 'talkshow', talkshow: 'talkshow',
      Minigame: 'minigame', minigame: 'minigame',
      Signings: 'signing', signing: 'signing',
      Exhibition: 'exhibition', exhibition: 'exhibition',
      launch: 'launch', Launch: 'launch',
    };
    const kind = kindByCategory[newAct.category] || 'talkshow';
    const locationId = partnerEventLocations.find(location => location.id === newAct.location || location.name === newAct.location)?.id || newAct.location;
    if (!locationId) throw new Error('Địa điểm hoạt động không còn tồn tại');
    const startAt = `${year}-${month}-${day}T${startTime}:00+07:00`;
    const endAt = `${year}-${month}-${day}T${endTime}:00+07:00`;
    const devices = (newAct.requiredEquipments || []).map(name => ({ name, quantity: 1 }));

    if (partnerApp?.eventId) {
      await partnerApi.submitActivityProposal({
        eventId: partnerApp.eventId,
        title: newAct.title,
        kind,
        locationId,
        startAt,
        endAt,
        capacity: newAct.capacity,
        targetAudience: newAct.targetAudience,
        description: newAct.description,
        speaker: newAct.speaker,
        imageUrl: newAct.imageUrl || undefined,
        devices,
      });
    } else {
      await partnerApi.registerEvent({
        title: newAct.title,
        kind,
        locationId,
        startAt,
        endAt,
        capacity: newAct.capacity,
        targetAudience: newAct.targetAudience,
        description: newAct.description,
        speaker: newAct.speaker,
        imageUrl: newAct.imageUrl || undefined,
        isPublished: false,
        devices,
      });
    }

    const [activities, reports] = await Promise.all([
      partnerApi.getActivityProposals(partnerApp?.eventId),
      partnerApi.getReports(partnerApp?.eventId),
    ]);
    setPartnerActivities(activities);
    if (reports) setPartnerReports(reports);
  };

  const handleUpdatePartnerActivity = async (id: string, updated: Partial<PartnerActivityProposal>) => {
    const saved = await partnerApi.updateActivityProposal(id, updated);
    setPartnerActivities(prev => prev.map(activity => activity.id === id ? saved : activity));
  };

  const handleRecordAttendanceScan = (rec: Omit<AttendanceScanRecord, 'id'>) => {
    const scanRecord: AttendanceScanRecord = {
      ...rec,
      id: crypto.randomUUID()
    };
    setAttendanceScans(prev => [scanRecord, ...prev]);
  };

  const handleMarkAllPartnerNotifsRead = async () => {
    await partnerApi.markAllNotificationsRead();
    setPartnerNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
  };

  const handlePartnerAttendanceScan = async (qrToken: string): Promise<Omit<AttendanceScanRecord, 'id'>> => {
    const result = await partnerApi.scanAttendance(qrToken) as {
      status: string; activityId: string; activityTitle: string; participantName: string; ticketCode: string;
    };
    return {
      activityId: result.activityId,
      activityTitle: result.activityTitle,
      participantName: result.participantName,
      ticketCode: result.ticketCode,
      scanTime: new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      status: result.status === 'already_completed' ? 'already_scanned' : 'success',
    };
  };

  const handleMarkPartnerNotifRead = async (id: string) => {
    await partnerApi.markNotificationRead(id);
    setPartnerNotifications(prev => prev.map(notification => notification.id === id ? { ...notification, isRead: true } : notification));
  };

  const handlePartnerLogout = () => {
    sessionStorage.removeItem(PARTNER_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem('duongsach_token');
    sessionStorage.removeItem('duongsach_refresh_token');
    sessionStorage.removeItem('duongsach_user');
    setIsPartnerAuthenticated(false);
    setIsAdminAuthenticated(false);
    navigate('/');
  };

  const handlePartnerLogin = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAdminAuthenticated(false);

    sessionStorage.setItem(PARTNER_SESSION_KEY, 'authenticated_partner');
    setIsPartnerAuthenticated(true);
  };

  // NẾU ĐANG TRUY CẬP KHU VỰC ĐỐI TÁC / PARTNER EXHIBITOR PORTAL
  if (isPartnerRoute) {
    if (!isPartnerAuthenticated) {
      return (
        <PartnerLoginPage
          language={language}
          onLoginSuccess={handlePartnerLogin}
        />
      );
    }

    if (partnerLoadError) return <div className="app-loading-state" role="alert">{partnerLoadError}</div>;
    if (!partnerOrg) return <div className="app-loading-state" role="status">Đang tải dữ liệu đối tác…</div>;
    const visiblePartnerOrg = partnerOrg;

    const assignedBooth = partnerBooths.find(b => b.assignedOrgId === visiblePartnerOrg.id || (b.assignedOrgName && visiblePartnerOrg.name && b.assignedOrgName.trim().toLowerCase() === visiblePartnerOrg.name.trim().toLowerCase()));
    const attendanceModalActivity = partnerActivities.find(a => a.id === activeAttendanceActivityId) || partnerActivities[0];

    return (
      <PartnerLayout
        language={language}
        organization={visiblePartnerOrg}
        unreadNotificationsCount={partnerNotifications.filter(n => !n.isRead).length}
        notifications={partnerNotifications}
        onMarkAllAsRead={handleMarkAllPartnerNotifsRead}
        onMarkItemAsRead={handleMarkPartnerNotifRead}
        onLogout={handlePartnerLogout}
      >
        <Routes>
          <Route path="/partner" element={
            partnerApp ? <PartnerDashboard
              language={language}
              organization={visiblePartnerOrg}
              activeEvent={partnerApp}
              assignedBooth={assignedBooth}
              activities={partnerActivities}
              todos={partnerTodos}
              totalEngagementCount={partnerReports?.totalParticipants || 0}
              onOpenAttendanceModal={() => setActiveAttendanceActivityId(partnerActivities[0]?.id || '')}
            /> : <div className="partner-page"><p className="app-loading-state">Mở “Lịch sự kiện” để đăng ký sự kiện mới độc lập. Bạn không cần tham gia một sự kiện khác trước đó.</p></div>
          } />
          <Route path="/partner/events" element={
            <EventApplicationPage
              language={language}
              organization={visiblePartnerOrg}
              activeApplication={partnerApp}
              assets={partnerAssets}
              locations={partnerEventLocations}
            />
          } />
          <Route path="/partner/events/apply" element={
            <EventApplicationPage
              language={language}
              organization={visiblePartnerOrg}
              activeApplication={partnerApp}
              assets={partnerAssets}
              locations={partnerEventLocations}
            />
          } />
          <Route path="/partner/booths" element={
            assignedBooth ? <BoothManagementPage
              language={language}
              booth={assignedBooth}
              onOpenAttendanceModal={() => setActiveAttendanceActivityId(partnerActivities[0]?.id || '')}
              onRequestCancel={(reason) => partnerApi.requestBoothCancellation(assignedBooth.id, reason || '')}
            /> : <UnassignedBoothPage language={language} />
          } />
          <Route path="/partner/booths/select" element={
            <BoothSelectionPage
              language={language}
              booths={partnerBooths}
              currentAssignedBoothId={assignedBooth?.id}
              currentAssignedBoothCode={assignedBooth?.code}
              organization={visiblePartnerOrg}
            />
          } />
          <Route path="/partner/activities" element={
            <ActivityProposalPage
              language={language}
              organization={visiblePartnerOrg}
              activities={partnerActivities}
              locations={partnerEventLocations}
              assets={partnerAssets}
              onAddActivity={handleAddPartnerActivity}
              onOpenAttendanceModal={(id) => setActiveAttendanceActivityId(id)}
            />
          } />
          <Route path="/partner/activities/:activityId" element={
            <PartnerActivityDetailPage
              language={language}
              activities={partnerActivities}
              onOpenAttendanceModal={(id) => setActiveAttendanceActivityId(id)}
              onUpdateActivity={handleUpdatePartnerActivity}
            />
          } />
          <Route path="/partner/reports" element={
            <PartnerReportsPage
              language={language}
              reportStats={partnerReports || { eventId: partnerApp?.eventId || '', eventName: partnerApp?.eventTitle || '', totalParticipants: 0, totalActivities: 0, attendanceRate: 0, averageRating: 0, ratingCount: 0, activityStats: [], ratingDistribution: [], feedbacks: [] }}
            />
          } />
          <Route path="/partner/books" element={<PartnerBookSalesPage language={language} booth={assignedBooth} />} />
          <Route path="/partner/book-sales" element={<Navigate to="/partner/books" replace />} />
          <Route path="/partner/notifications" element={
            <PartnerNotificationsPage
              language={language}
              notifications={partnerNotifications}
              onMarkAllAsRead={handleMarkAllPartnerNotifsRead}
              onMarkItemAsRead={handleMarkPartnerNotifRead}
            />
          } />
          <Route path="/partner/organization" element={<Navigate to="/partner/profile" replace />} />
          <Route path="/partner/profile" element={
            <PartnerProfilePage
              language={language}
              organization={visiblePartnerOrg}
              onUpdateOrg={async (updated) => setPartnerOrg(await partnerApi.updateProfile(updated))}
            />
          } />
          <Route path="*" element={<Navigate to="/partner" replace />} />
        </Routes>

        {activeAttendanceActivityId && attendanceModalActivity && (
          <ActivityAttendanceModal
            language={language}
            activity={attendanceModalActivity}
            scans={attendanceScans}
            onClose={() => setActiveAttendanceActivityId(null)}
            onRecordScan={handleRecordAttendanceScan}
            onScanQr={handlePartnerAttendanceScan}
          />
        )}
      </PartnerLayout>
    );
  }

  // --- Admin Portal Handlers & Routing ---
  const handleAdminLoginSuccess = () => {
    sessionStorage.removeItem(PARTNER_SESSION_KEY);
    setIsPartnerAuthenticated(false);
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated_admin');
    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(PARTNER_SESSION_KEY);
    sessionStorage.removeItem('duongsach_token');
    sessionStorage.removeItem('duongsach_refresh_token');
    sessionStorage.removeItem('duongsach_user');
    setIsAdminAuthenticated(false);
    setIsPartnerAuthenticated(false);
    navigate('/');
  };

  // NẾU ĐANG TRUY CẬP KHU VỰC QUẢN TRỊ VIÊN HỆ THỐNG / ADMIN PORTAL (/admin)
  if (isAdminRoute) {
    if (!isAdminAuthenticated) {
      return (
        <AdminLoginPage
          language={language}
          onLoginSuccess={handleAdminLoginSuccess}
        />
      );
    }

    return (
      <div className="duongsach-app-root admin-mode-active">
        <AdminPortal
          language={language}
          onLogout={handleAdminLogout}
        />
      </div>
    );
  }

  // GIAO DIỆN CÔNG KHAI
  return (
    <div className="duongsach-app-root">
      {!isSlidePageOpen && !isLibrary && (
        <Header 
          language={language} 
          onLanguageChange={(lang) => setLanguage(lang)}
        />
      )}

      <div className={`main-app-container ${isSlidePageOpen ? 'heritage-active-bg' : ''}`} inert={isSlidePageOpen} aria-hidden={isSlidePageOpen || undefined}>
        {isLibrary ? (
          <>
            <DigitalLibraryPage language={language} />
            <Footer language={language} />
          </>
        ) : (
          <>
        <main id="main-content">
          {publicDataError && <p className="app-loading-state" role="alert">{publicDataError}</p>}
          <Hero 
            language={language}
            onExploreClick={() => scrollToSection('gian-hang')}
            onMapClick={() => scrollToSection('ban-do')}
            onSearch={handleHeroSearch}
            booths={booths}
          />

          <BoothsSection 
            language={language}
            booths={booths}
            isLoading={isPublicDataLoading}
            onSelectBoothOnMap={handleSelectBoothOnMap}
            searchQuery={boothSearchQuery}
            onSearchQueryChange={setBoothSearchQuery}
            focusedBoothId={focusedBoothId}
          />

          <EventsSection 
            language={language} 
            events={events}
            isLoading={isPublicDataLoading}
          />


          <DigitalLibrarySection language={language} />

          <InteractiveMap 
            language={language}
            booths={booths}
            highlightedBoothId={highlightedBoothId}
            onNavigateToBoothDetail={handleNavigateToBoothDetail}
          />
        </main>

        <Footer language={language} />
          </>
        )}
      </div>

      {isBooths && (
        <BoothsExperience
          language={language}
          open={isBooths}
          booths={booths}
          onSelectBoothOnMap={handleSelectBoothOnMap}
        />
      )}
      {isEvents && (
        <EventsExperience
          language={language}
          open={isEvents}
          events={events}
        />
      )}
      {isNews && <NewsExperience language={language} open={isNews} />}
      {isJourney && <JourneyExperience language={language} open={isJourney} />}
      {isOrganization && <OrganizationExperience language={language} open={isOrganization} />}
      {isContact && <ContactExperience language={language} open={isContact} />}

    </div>
  );
}

export default App;
