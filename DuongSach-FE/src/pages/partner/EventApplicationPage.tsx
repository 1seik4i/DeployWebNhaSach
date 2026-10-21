import { EventRegistrationModal, EventRegistrationData } from '../../components/portal/EventRegistrationModal';
import { eventRegistrationPayload } from '../../services/eventRegistration';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Users, 
  Store, 
  CheckCircle2, 
  PlusCircle, 
  Plus,
  Building2, 
  X, 
  Sparkles, 
  Send, 
  Filter, 
  Layers, 
  AlertCircle,
  FileText,
  Search,
  Check,
  CalendarDays,
  Info,
  ArrowRight,
  ChevronDown,
  Mic2,
  Tv,
  HelpCircle,
  Award,
  Upload,
  Trash2
} from 'lucide-react';
import { Language, PartnerOrganization, PartnerEventApplication } from '../../types';
import { OrganizerEvent } from '../../types/organizer';
import { partnerApi } from '../../services/partnerApi';
import { getEventStatusColor } from '../../utils/eventColors';
import './PartnerPages.css';

// Extended Event Item type with specific schedule time slot and hosting details
export interface ScheduledEventItem extends OrganizerEvent {
  timeStr: string; // e.g. "08:30 – 11:30"
  badgeColor: string;
  categoryTag: string;
  hostOrgName?: string;
  participationStatus?: string;
  speaker?: string;
  equipment?: string[];
  expectedAttendees?: string;
}

interface EventApplicationPageProps {
  language: Language;
  organization: PartnerOrganization;
  activeApplication?: PartnerEventApplication | null;
  assets: Array<{ id: string; name: string; totalQuantity: number }>;
  locations: Array<{ id: string; name: string; capacity: number }>;
}

export const EventApplicationPage: React.FC<EventApplicationPageProps> = ({
  language,
  organization,
  activeApplication,
  assets,
  locations,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const notificationEventId = searchParams.get('eventId');
  const vietnamDateKey = () => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date()).reduce<Record<string, string>>((result, part) => ({ ...result, [part.type]: part.value }), {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  const todayKey = vietnamDateKey();

  // The calendar is populated only from the Partner schedule API.
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEventItem[]>([]);
  const [scheduleError, setScheduleError] = useState('');

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayKey);
  const [selectedEvent, setSelectedEvent] = useState<ScheduledEventItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<'all' | 'happening' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Event Detail Popup Modal State
  const [detailModalEvent, setDetailModalEvent] = useState<ScheduledEventItem | null>(null);
  useEffect(() => {
    if (!notificationEventId) return;
    const event = scheduledEvents.find(item => item.id === `event:${notificationEventId}`);
    if (event) {
      setDetailModalEvent(event);
      setSelectedEvent(event);
    }
  }, [notificationEventId, scheduledEvents]);

  // Day Events List Modal State (Apple Calendar style expanded day popover)
  const [dayOverviewModal, setDayOverviewModal] = useState<{ dateStr: string; day: number; events: ScheduledEventItem[] } | null>(null);

  // Proposal/Organizing Registration Modal State
  const [isOrganizeModalOpen, setIsOrganizeModalOpen] = useState(false);
  const [registrationLocations, setRegistrationLocations] = useState(locations);
  useEffect(() => {
    if (!isOrganizeModalOpen) return;
    let active = true;
    void partnerApi.getEventLocations().then(items => { if (active) setRegistrationLocations(items); }).catch(error => setScheduleError(error instanceof Error ? error.message : 'Không thể tải địa điểm tổ chức.'));
    return () => { active = false; };
  }, [isOrganizeModalOpen]);

  useModalBehavior(Boolean(detailModalEvent), () => setDetailModalEvent(null));
  useModalBehavior(Boolean(dayOverviewModal), () => setDayOverviewModal(null));

  const [registrationDate, setRegistrationDate] = useState(todayKey);

  // Success Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchSchedule = () => {
    partnerApi.getSchedule().then(items => {
      setScheduleError('');
      const today = vietnamDateKey();
      const schedule = items as unknown as ScheduledEventItem[];
      setScheduledEvents(schedule);
      setDetailModalEvent(prev => prev ? schedule.find(item => item.id === prev.id) || prev : null);
      setSelectedEvent(prev => {
        if (prev) {
          const found = schedule.find(item => item.id === prev.id);
          if (found) return found;
        }
        return schedule.find(item => item.startDate <= today && item.endDate >= today) || schedule[0] || null;
      });
    }).catch(error => setScheduleError(error instanceof Error ? error.message : 'Không thể tải lịch sự kiện'));
  };

  useEffect(() => {
    const today = vietnamDateKey();
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateStr(today);

    fetchSchedule();
    window.addEventListener('focus', fetchSchedule);
    window.addEventListener('duongsach:data-changed', fetchSchedule);
    return () => {
      window.removeEventListener('focus', fetchSchedule);
      window.removeEventListener('duongsach:data-changed', fetchSchedule);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  const applyToPublishedEvent = async (item: ScheduledEventItem) => {
    if (item.participationStatus === 'approved') return;
    if (!item.id.startsWith('event:')) {
      showToast(language === 'vi' ? 'Đây là một hoạt động trong lịch; hãy chọn sự kiện chính để đăng ký tham gia.' : 'Select the parent event to apply.');
      return;
    }
    if (item.status !== 'happening' && item.status !== 'upcoming') {
      showToast(language === 'vi' ? 'Chỉ được đăng ký tham gia sự kiện đang diễn ra hoặc sắp diễn ra.' : 'Only ongoing or upcoming events accept applications.');
      return;
    }
    try {
      await partnerApi.submitApplication(item.id.slice('event:'.length));
      setDetailModalEvent(null);
      showToast(language === 'vi' ? 'Đã gửi hồ sơ tham gia sự kiện đến Ban Quản Lý.' : 'Event application submitted.');
      window.dispatchEvent(new Event('duongsach:data-changed'));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không thể gửi hồ sơ tham gia sự kiện');
    }
  };

  const monthNamesVi = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar Grid Calculation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon...
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Start from Monday (Apple standard)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
      events: ScheduledEventItem[];
    }> = [];

    // Prev month padding
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        events: []
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      // Check events on this date
      const evts = scheduledEvents.filter(evt => {
        if (!evt.startDate || !evt.endDate) return false;
        if (filterCategory === 'happening') {
          if (!(todayKey >= evt.startDate && todayKey <= evt.endDate) && evt.status !== 'happening') {
            return false;
          }
        } else if (filterCategory === 'upcoming') {
          if (evt.startDate <= todayKey && evt.status !== 'upcoming') {
            return false;
          }
        }
        return dateStr >= evt.startDate && dateStr <= evt.endDate;
      });

      days.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        events: evts
      });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 1 : currentMonth + 2;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        events: []
      });
    }

    return days;
  }, [currentYear, currentMonth, scheduledEvents, filterCategory, todayKey]);

  // Events occurring on the currently selected date (for compact mobile agenda view)
  const selectedDayEvents = useMemo(() => {
    return scheduledEvents.filter(evt => {
      if (!evt.startDate || !evt.endDate) return false;
      return selectedDateStr >= evt.startDate && selectedDateStr <= evt.endDate;
    });
  }, [scheduledEvents, selectedDateStr]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleOpenDetailModal = (evt: ScheduledEventItem) => {
    setDetailModalEvent(evt);
  };

  const handleOpenOrganizeModal = (presetDate?: string) => {
    const date = presetDate || selectedDateStr;
    setRegistrationDate(date >= todayKey ? date : todayKey);
    setIsOrganizeModalOpen(true);
  };

  const handleRegisterEvent = async (registration: EventRegistrationData) => {
    await partnerApi.registerEvent(eventRegistrationPayload(registration));
    window.dispatchEvent(new Event('duongsach:data-changed'));
    fetchSchedule();
    showToast(language === 'vi' ? 'Đã gửi đăng ký sự kiện đến Ban Quản Lý phê duyệt.' : 'Event registration submitted for approval.');
  };

  return (
    <div className="event-application-page" style={{ maxWidth: '100%', margin: '0 auto' }}>
      {scheduleError && <p className="app-error-state">{scheduleError}</p>}
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#17382E',
          color: '#FFFFFF',
          padding: '0.95rem 1.45rem',
          borderRadius: '14px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
          zIndex: 99999,
          fontSize: '0.92rem',
          fontWeight: 650,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          border: '1.5px solid #E9BC63',
          animation: 'fadeIn 0.25s ease'
        }}>
          <CheckCircle2 size={22} color="#E9BC63" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Apple-Styled Navigation Bar */}
      <div className="partner-page-header" style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h1 className="partner-page-title">
            {language === 'vi' ? 'Lịch sự kiện' : 'Event Calendar'}
          </h1>
          <p className="partner-page-sub">
            {language === 'vi' 
              ? 'Theo dõi lịch sự kiện toàn không gian và gửi đề xuất tổ chức hoạt động tại Đường Sách.' 
              : 'Track Book Street event schedules and propose new hosting activities.'}
          </p>
        </div>

        <div className="partner-page-header-actions">
          
          <button
            type="button"
            className="btn-part-primary"
            onClick={() => handleOpenOrganizeModal()}
            style={{
              padding: '0.65rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              borderRadius: '9px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(23, 56, 46, 0.2)'
            }}
          >
            <Plus size={16} />
            <span>{language === 'vi' ? 'Đăng ký sự kiện mới' : 'Register New Event'}</span>
          </button>
        </div>
      </div>

      {/* 2. Apple-Designed Full-Width Calendar Panel */}
      {/* 2. CALENDAR MONTH VIEW */}
      <div className="partner-calendar-panel" style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        marginBottom: '2rem'
      }}>
        {/* Apple Calendar Top Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid #EEF2F0',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h2 className="cal-month-heading">
              {language === 'vi' ? monthNamesVi[currentMonth] : monthNamesEn[currentMonth]}
              <span style={{ color: '#B3862A', fontWeight: 700, marginLeft: '6px' }}>{currentYear}</span>
            </h2>

            {/* Apple Segmented Nav Buttons */}
            <div style={{
              display: 'inline-flex',
              background: '#F3F4F6',
              borderRadius: '8px',
              padding: '2px 4px',
              marginLeft: '14px',
              alignItems: 'center',
              gap: '2px'
            }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Tháng trước"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#17382E'
                }}
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Tháng sau"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#17382E'
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* Quick Actions & Filter Tabs with Underline Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex',
              gap: '0.25rem',
              background: '#F9FAFB',
              padding: '3px 4px',
              borderRadius: '8px'
            }}>
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: filterCategory === 'all' ? '2.5px solid #111827' : '2.5px solid transparent',
                  padding: '0.45rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: filterCategory === 'all' ? 700 : 500,
                  color: filterCategory === 'all' ? '#111827' : '#6B7280',
                  cursor: 'pointer',
                  borderRadius: 0,
                  transition: 'all 120ms ease'
                }}
                onClick={() => setFilterCategory('all')}
              >
                {language === 'vi' ? 'Tất cả sự kiện' : 'All'}
              </button>
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: filterCategory === 'happening' ? '2.5px solid #111827' : '2.5px solid transparent',
                  padding: '0.45rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: filterCategory === 'happening' ? 700 : 500,
                  color: filterCategory === 'happening' ? '#111827' : '#6B7280',
                  cursor: 'pointer',
                  borderRadius: 0,
                  transition: 'all 120ms ease'
                }}
                onClick={() => setFilterCategory('happening')}
              >
                {language === 'vi' ? 'Đang diễn ra' : 'Happening'}
              </button>
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: filterCategory === 'upcoming' ? '2.5px solid #111827' : '2.5px solid transparent',
                  padding: '0.45rem 1rem',
                  fontSize: '0.82rem',
                  fontWeight: filterCategory === 'upcoming' ? 700 : 500,
                  color: filterCategory === 'upcoming' ? '#111827' : '#6B7280',
                  cursor: 'pointer',
                  borderRadius: 0,
                  transition: 'all 120ms ease'
                }}
                onClick={() => setFilterCategory('upcoming')}
              >
                {language === 'vi' ? 'Sắp tới' : 'Upcoming'}
              </button>
            </div>
          </div>
        </div>

        <div className="partner-event-status-legend" aria-label={language === 'vi' ? 'Chú thích trạng thái sự kiện' : 'Event status legend'}>
          <span className="partner-event-status-legend-label">{language === 'vi' ? 'Chú thích:' : 'Legend:'}</span>
          {([
            ['happening', 'Đang diễn ra', 'Happening'],
            ['upcoming', 'Sắp diễn ra', 'Upcoming'],
            ['completed', 'Đã kết thúc', 'Completed'],
            ['draft', 'Bản nháp', 'Draft'],
          ] as const).map(([status, vi, en]) => (
            <span key={status} className="partner-event-status-legend-item">
              <span aria-hidden="true" className="partner-event-status-legend-dot" style={{ backgroundColor: getEventStatusColor(status) }} />
              {language === 'vi' ? vi : en}
            </span>
          ))}
        </div>

        {/* Calendar Weekday Header */}
        <div className="cal-weekday-header">
          <div><span className="cal-weekday-desktop">{language === 'vi' ? 'Thứ 2' : 'Mon'}</span><span className="cal-weekday-mobile">T2</span></div>
          <div><span className="cal-weekday-desktop">{language === 'vi' ? 'Thứ 3' : 'Tue'}</span><span className="cal-weekday-mobile">T3</span></div>
          <div><span className="cal-weekday-desktop">{language === 'vi' ? 'Thứ 4' : 'Wed'}</span><span className="cal-weekday-mobile">T4</span></div>
          <div><span className="cal-weekday-desktop">{language === 'vi' ? 'Thứ 5' : 'Thu'}</span><span className="cal-weekday-mobile">T5</span></div>
          <div><span className="cal-weekday-desktop">{language === 'vi' ? 'Thứ 6' : 'Fri'}</span><span className="cal-weekday-mobile">T6</span></div>
          <div><span className="cal-weekday-desktop">{language === 'vi' ? 'Thứ 7' : 'Sat'}</span><span className="cal-weekday-mobile">T7</span></div>
          <div style={{ color: '#DC2626' }}><span className="cal-weekday-desktop">{language === 'vi' ? 'Chủ nhật' : 'Sun'}</span><span className="cal-weekday-mobile">CN</span></div>
        </div>

        {/* Calendar Grid */}
        <div className="cal-days-grid">
          {calendarDays.map((cell, idx) => {
            const hasEvents = cell.events.length > 0;
            const isSelected = cell.dateStr === selectedDateStr;
            const todayKey = vietnamDateKey();
            const isToday = cell.dateStr === todayKey;
            const visibleEvents = cell.events.slice(0, 2);
            const extraCount = cell.events.length - 2;

            const isPastDate = cell.dateStr < todayKey;

            return (
              <div
                key={idx}
                onClick={() => {
                  setSelectedDateStr(cell.dateStr);
                  if (window.innerWidth > 768) {
                    if (!isPastDate) {
                      handleOpenOrganizeModal(cell.dateStr);
                    } else if (hasEvents) {
                      setDayOverviewModal({ dateStr: cell.dateStr, day: cell.day, events: cell.events });
                    }
                  }
                }}
                className={`cal-day-cell-partner ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${!cell.isCurrentMonth ? 'not-current-month' : ''}`}
                title={isPastDate ? (hasEvents ? (language === 'vi' ? 'Ngày đã diễn ra - Bấm để xem các sự kiện' : 'Past date - Click to view events') : (language === 'vi' ? 'Ngày đã qua - Không thể đăng ký sự kiện' : 'Past date - Cannot register event')) : undefined}
                style={{
                  minHeight: '138px',
                  padding: '10px',
                  borderRadius: '12px',
                  background: isToday 
                    ? '#F4F9F6' 
                    : cell.isCurrentMonth 
                      ? '#FFFFFF' 
                      : '#FAFAFA',
                  border: isToday 
                    ? '2.5px solid #17382E' 
                    : isSelected 
                      ? '1.5px solid #648A7D' 
                      : '1px solid #EAEFEA',
                  cursor: isPastDate ? (hasEvents ? 'pointer' : 'not-allowed') : 'pointer',
                  opacity: isPastDate && !cell.isCurrentMonth ? 0.35 : (isPastDate && !hasEvents ? 0.65 : 1),
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  transition: 'all 160ms cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isToday 
                    ? '0 4px 16px rgba(23, 56, 46, 0.14)' 
                    : '0 1px 2px rgba(0,0,0,0.02)',
                  position: 'relative'
                }}
              >
                {/* Cell Header: Day Number + Event Counter Badge / + Trống */}
                <div className="cal-cell-header" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isToday ? (
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: '#17382E',
                        display: 'grid',
                        placeItems: 'center',
                        lineHeight: 1,
                        boxShadow: '0 2px 6px rgba(23, 56, 46, 0.3)'
                      }}>
                        {cell.day}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: cell.isCurrentMonth ? '#1F2937' : '#9CA3AF',
                        lineHeight: 1
                      }}>
                        {cell.day}
                      </span>
                    )}
                  </div>

                  {hasEvents ? (
                    <span 
                      className="cal-event-badge-desktop"
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 650,
                        background: cell.events.length >= 3 ? '#FEF3C7' : '#E8F5EF',
                        color: cell.events.length >= 3 ? '#92400E' : '#065F46',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      title={`${cell.events.length} sự kiện trong ngày`}
                    >
                      {cell.events.length} sự kiện
                    </span>
                  ) : (
                    <span 
                      className="cal-empty-text-desktop"
                      style={{
                        fontSize: '0.7rem',
                        color: '#CBD5E1',
                        fontWeight: 500,
                        userSelect: 'none'
                      }}
                      title={isPastDate ? (language === 'vi' ? 'Ngày đã qua' : 'Past date') : (language === 'vi' ? 'Bấm để đăng ký tổ chức sự kiện vào ngày này' : 'Click to register event')}
                    >
                      {isPastDate ? '—' : '+ Trống'}
                    </span>
                  )}
                </div>

                {/* Mobile: Compact indicator dots */}
                {hasEvents && (
                  <div className="cal-cell-dots-mobile">
                    {cell.events.slice(0, 3).map((ev, dotIdx) => (
                      <span 
                        key={dotIdx} 
                        className="cal-cell-dot" 
                        style={{ backgroundColor: getEventStatusColor(ev.status) }} 
                      />
                    ))}
                    {cell.events.length > 3 && <span className="cal-cell-dot-plus">+</span>}
                  </div>
                )}

                {/* Stack of Scheduled Events as Clean Multi-line Cards on Desktop */}
                {hasEvents && (
                  <div className="cal-cell-events-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    {visibleEvents.map((ev, evIdx) => {
                      const borderColor = getEventStatusColor(ev.status);
                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                            setSelectedDateStr(cell.dateStr);
                            handleOpenDetailModal(ev);
                          }}
                          style={{
                            borderRadius: '6px',
                            background: '#FFFFFF',
                            border: '1px solid #EAEFEA',
                            borderLeft: `3px solid ${borderColor}`,
                            padding: '4px 6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            transition: 'all 120ms ease',
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                          }}
                          title={`Bấm xem chi tiết: ${ev.title} (${ev.timeStr})`}
                        >
                          <div style={{
                            fontSize: '0.66rem',
                            fontWeight: 750,
                            color: borderColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <Clock size={10} />
                            <span>{ev.timeStr}</span>
                          </div>
                          <div style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            lineHeight: 1.3,
                            color: '#172421',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {ev.title}
                          </div>
                        </div>
                      );
                    })}

                    {/* Show more indicator if > 2 events on this day */}
                    {extraCount > 0 && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDayOverviewModal({ dateStr: cell.dateStr, day: cell.day, events: cell.events });
                        }}
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 750,
                          color: '#B3862A',
                          textAlign: 'center',
                          padding: '3px 0',
                          cursor: 'pointer',
                          background: '#FAF6ED',
                          borderRadius: '6px',
                          border: '1px dashed #E5D5B8',
                          marginTop: 'auto',
                          transition: 'background 120ms ease'
                        }}
                        title="Bấm xem tất cả sự kiện trong ngày"
                      >
                        + Xem thêm {extraCount} sự kiện...
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Compact Mobile Agenda Section for Selected Day */}
        <div className="cal-selected-day-agenda-mobile">
          <div className="agenda-mobile-header">
            <div className="agenda-mobile-title-block">
              <span className="agenda-date-label">
                {(() => {
                  try {
                    const parts = selectedDateStr.split('-');
                    if (parts.length === 3) {
                      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                      const dayNameVi = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()];
                      const dayNameEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
                      return language === 'vi' 
                        ? `${dayNameVi}, ngày ${parts[2]}/${parts[1]}/${parts[0]}`
                        : `${dayNameEn}, ${parts[2]}/${parts[1]}/${parts[0]}`;
                    }
                  } catch {}
                  return selectedDateStr;
                })()}
              </span>
              <span className="agenda-count-badge">
                {selectedDayEvents.length} {language === 'vi' ? 'sự kiện' : 'events'}
              </span>
            </div>

            {selectedDateStr >= todayKey && (
              <button
                type="button"
                className="agenda-propose-btn"
                onClick={() => handleOpenOrganizeModal(selectedDateStr)}
              >
                <Plus size={13} />
                <span>{language === 'vi' ? 'Đề xuất' : 'Propose'}</span>
              </button>
            )}
          </div>

          <div className="agenda-mobile-list">
            {selectedDayEvents.length === 0 ? (
              <div className="agenda-empty-state">
                <p>{language === 'vi' ? 'Không có sự kiện nào trong ngày này.' : 'No events scheduled for this date.'}</p>
                {selectedDateStr >= todayKey && (
                  <button
                    type="button"
                    className="agenda-empty-add-btn"
                    onClick={() => handleOpenOrganizeModal(selectedDateStr)}
                  >
                    <Plus size={14} />
                    <span>{language === 'vi' ? 'Đăng ký sự kiện mới vào ngày này' : 'Register new event for this date'}</span>
                  </button>
                )}
              </div>
            ) : (
              selectedDayEvents.map(ev => (
                <div 
                  key={ev.id} 
                  className="agenda-event-card"
                  onClick={() => setDetailModalEvent(ev)}
                >
                  <div className="agenda-event-left">
                    <div className="agenda-event-time">
                      <Clock size={13} />
                      <span>{ev.timeStr ? ev.timeStr : (language === 'vi' ? 'Cả ngày' : 'All day')}</span>
                    </div>
                    <h4 className="agenda-event-title">{ev.title}</h4>
                    <div className="agenda-event-meta">
                      {ev.location && <span>📍 {ev.location}</span>}
                      {ev.categoryTag && <span className="agenda-cat-tag">{ev.categoryTag}</span>}
                    </div>
                  </div>
                  <div className="agenda-event-right">
                    <ChevronRight size={18} className="agenda-chevron" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. POPUP MODAL: Thông tin chi tiết 1 sự kiện (Event Details Modal) */}
      {detailModalEvent && (
        <div 
          className="attendance-modal-overlay" 
          onClick={() => setDetailModalEvent(null)}
          style={{ zIndex: 9998 }}
        >
          <div 
            className="attendance-modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '640px', overflow: 'hidden', padding: 0, borderRadius: '20px' }}
          >
            {/* Cover Image & Status Badge */}
            <div style={{ position: 'relative', height: '220px', width: '100%' }}>
              <img 
                src={detailModalEvent.imageUrl} 
                alt={detailModalEvent.title} 
                style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', background: '#F3F4F6' }}
              />
              <button
                type="button"
                onClick={() => setDetailModalEvent(null)}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: 'rgba(0,0,0,0.55)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <X size={18} />
              </button>
              
              <div style={{
                position: 'absolute',
                bottom: '14px',
                left: '16px',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}>
                <span style={{
                  background: getEventStatusColor(detailModalEvent.status),
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 750,
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                }}>
                  {detailModalEvent.categoryTag || '—'}
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.92)',
                  color: '#172421',
                  fontSize: '0.78rem',
                  fontWeight: 750,
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  backdropFilter: 'blur(8px)'
                }}>
                  🕒 {detailModalEvent.timeStr}
                </span>
              </div>
            </div>

            {/* Modal Body Info */}
            <div style={{ padding: '1.75rem' }}>
              <h3 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#172421',
                margin: '0 0 0.85rem 0',
                lineHeight: 1.3
              }}>
                {detailModalEvent.title}
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.86rem',
                color: '#495D57',
                marginBottom: '1.25rem',
                padding: '0.85rem 1rem',
                background: '#FAF8F3',
                borderRadius: '12px',
                border: '1px solid #EFE8D8'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CalendarIcon size={16} color="#B3862A" />
                  <span><strong>{language === 'vi' ? 'Ngày diễn ra:' : 'Date:'}</strong> {detailModalEvent.dateRange}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="#B3862A" />
                  <span><strong>{language === 'vi' ? 'Khung giờ:' : 'Time Slot:'}</strong> {detailModalEvent.timeStr}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} color="#B3862A" />
                  <span><strong>{language === 'vi' ? 'Địa điểm:' : 'Location:'}</strong> {detailModalEvent.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building2 size={16} color="#B3862A" />
                  <span><strong>{language === 'vi' ? 'Đơn vị tổ chức:' : 'Host Org:'}</strong> {detailModalEvent.hostOrgName || '—'}</span>
                </div>
                {detailModalEvent.speaker && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', gridColumn: '1 / -1' }}>
                    <Mic2 size={16} color="#B3862A" />
                    <span><strong>{language === 'vi' ? 'Diễn giả / Khách mời:' : 'Speaker:'}</strong> {detailModalEvent.speaker}</span>
                  </div>
                )}
              </div>

              <h4 style={{ fontSize: '0.92rem', fontWeight: 750, color: '#172421', margin: '0 0 0.4rem 0' }}>
                {language === 'vi' ? 'Nội dung chi tiết chương trình:' : 'Event Description:'}
              </h4>
              <p style={{ fontSize: '0.88rem', color: '#556B65', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
                {detailModalEvent.description}
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #EEF2F0', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn-part-secondary"
                  onClick={() => setDetailModalEvent(null)}
                >
                  {language === 'vi' ? 'Đóng' : 'Close'}
                </button>

                <button
                  type="button"
                  className="btn-part-primary"
                  onClick={() => void applyToPublishedEvent(detailModalEvent)}
                  disabled={detailModalEvent.participationStatus === 'approved' || !detailModalEvent.id.startsWith('event:') || (detailModalEvent.status !== 'happening' && detailModalEvent.status !== 'upcoming')}
                  title={language === 'vi' ? 'Sự kiện đang diễn ra hoặc sắp diễn ra luôn nhận đăng ký tham gia, không áp dụng hạn đăng ký.' : 'Ongoing and upcoming events accept applications without a registration deadline.'}
                  style={{
                    boxShadow: '0 4px 14px rgba(23, 56, 46, 0.22)'
                  }}
                >
                  {detailModalEvent.participationStatus === 'approved' ? <CheckCircle2 size={16} /> : <PlusCircle size={16} />}
                  <span>{detailModalEvent.participationStatus === 'approved'
                    ? (language === 'vi' ? 'Đã tham gia' : 'Joined')
                    : (language === 'vi' ? 'Đăng ký tham gia sự kiện này' : 'Apply to This Event')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. POPUP MODAL: Danh sách tất cả sự kiện trong ngày (Apple Day Schedule Popover) */}
      {dayOverviewModal && (
        <div 
          className="attendance-modal-overlay" 
          onClick={() => setDayOverviewModal(null)}
          style={{ zIndex: 9997 }}
        >
          <div 
            className="attendance-modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '620px', borderRadius: '18px' }}
          >
            <div className="attendance-modal-header" style={{
              background: '#FAFCFB',
              borderBottom: '1px solid #EEF2F0',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontFamily: 'var(--font-serif)',
                  fontWeight: 800,
                  color: '#172421'
                }}>
                  {language === 'vi' ? `Lịch biểu Ngày ${dayOverviewModal.day} ${monthNamesVi[currentMonth]}` : `Schedule for Day ${dayOverviewModal.day}`}
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.84rem', color: '#556B65' }}>
                  Có tổng cộng <strong>{dayOverviewModal.events.length} sự kiện</strong> được lên lịch
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDayOverviewModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#637771' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* List of Day's Events with Exact Times */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {dayOverviewModal.events.map(ev => (
                <div
                  key={ev.id}
                  onClick={() => {
                    setDayOverviewModal(null);
                    handleOpenDetailModal(ev);
                  }}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2EAE5',
                    borderLeft: `4px solid ${getEventStatusColor(ev.status)}`,
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    transition: 'all 150ms ease'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{
                        background: getEventStatusColor(ev.status),
                        color: ev.status === 'draft' ? '#3b2802' : '#FFFFFF',
                        fontSize: '0.68rem', fontWeight: 800,
                        padding: '0.2rem 0.5rem', borderRadius: '6px',
                      }}>
                        {language === 'vi'
                          ? ({ happening: 'Đang diễn ra', upcoming: 'Sắp diễn ra', completed: 'Đã kết thúc', draft: 'Bản nháp' }[ev.status] || ev.status)
                          : ({ happening: 'Happening', upcoming: 'Upcoming', completed: 'Completed', draft: 'Draft' }[ev.status] || ev.status)}
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: getEventStatusColor(ev.status),
                        background: '#F0F7F4',
                        padding: '2px 7px',
                        borderRadius: '6px'
                      }}>
                        🕒 {ev.timeStr}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#637771' }}>
                        📍 {ev.location}
                      </span>
                    </div>
                    <h4 style={{
                      margin: 0,
                      fontSize: '0.98rem',
                      fontWeight: 750,
                      color: '#172421',
                      lineHeight: 1.35
                    }}>
                      {ev.title}
                    </h4>
                    {ev.hostOrgName && (
                      <span style={{ fontSize: '0.75rem', color: '#7E928B' }}>
                        Tổ chức bởi: {ev.hostOrgName}
                      </span>
                    )}
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn-part-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', height: '32px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDayOverviewModal(null);
                        handleOpenDetailModal(ev);
                      }}
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))}

              {(() => {
                    const todayKey = vietnamDateKey();
                const isModalPast = dayOverviewModal.dateStr < todayKey;

                if (isModalPast) return null;

                return (
                  <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn-part-primary"
                      onClick={() => {
                        const date = dayOverviewModal.dateStr;
                        setDayOverviewModal(null);
                        handleOpenOrganizeModal(date);
                      }}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <PlusCircle size={16} />
                      <span>{language === 'vi' ? 'Đăng ký sự kiện mới vào ngày này' : 'Register new event for this date'}</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {isOrganizeModalOpen && <EventRegistrationModal
        language={language}
        isOpen
        onClose={() => setIsOrganizeModalOpen(false)}
        onRegister={handleRegisterEvent}
        locations={registrationLocations}
        initialDate={registrationDate}
        organization={organization}
        assets={assets}
      />}

    </div>
  );
};

