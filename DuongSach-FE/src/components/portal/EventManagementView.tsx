import { AdminPageHeading } from '../admin/AdminPageHeading';
import { useModalBehavior } from '../../hooks/useModalBehavior';
import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Users, 
  Store, 
  Plus, 
  X, 
  Sparkles, 
  Search, 
  Eye, 
  EyeOff, 
  Edit3, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { Language } from '../../types';
import { OrganizerEvent } from '../../types/organizer';
import { getEventStatusColor } from '../../utils/eventColors';
import './EventManagementView.css';

interface EventManagementViewProps {
  language: Language;
  events: OrganizerEvent[];
  onSelectEvent: (eventId: string) => void;
  onOpenCreateEvent: () => void;
  onEditEvent?: (event: OrganizerEvent) => void;
  onTogglePublishEvent?: (eventId: string) => void;
  onBroadcastEvent?: (eventId: string) => void | Promise<void>;
  onDuplicateEvent?: (eventId: string) => void | Promise<void>;
  onCancelEvent?: (eventId: string) => void | Promise<void>;
}

export const EventManagementView: React.FC<EventManagementViewProps> = ({
  language,
  events,
  onSelectEvent,
  onOpenCreateEvent,
  onEditEvent,
  onTogglePublishEvent
}) => {
  // Initialize calendar with real-time current year and month
  const initialDate = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, []);

  const [currentYear, setCurrentYear] = useState<number>(initialDate.year);
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.month);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'happening' | 'upcoming' | 'completed' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Event Detail Modal
  const [previewEvent, setPreviewEvent] = useState<OrganizerEvent | null>(null);
  // Day Overview Modal (for days with multiple events)
  const [dayOverviewModal, setDayOverviewModal] = useState<{ dateStr: string; day: number; events: OrganizerEvent[] } | null>(null);

  useModalBehavior(Boolean(previewEvent), () => setPreviewEvent(null));
  useModalBehavior(Boolean(dayOverviewModal), () => setDayOverviewModal(null));

  const monthNamesVi = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

  // Filter events based on search query and status filter
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // Status filter
      if (activeStatusFilter !== 'all' && e.status !== activeStatusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().normalize('NFC').toLocaleLowerCase('vi-VN');
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchLoc = (e.location || '').toLowerCase().includes(q);
        const matchDesc = (e.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchLoc && !matchDesc) return false;
      }
      return true;
    });
  }, [events, activeStatusFilter, searchQuery]);

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const numDays = lastDayOfMonth.getDate();

    // In Vietnam, Monday is index 0, Sunday is index 6
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const days: Array<{
      dateStr: string;
      day: number;
      isCurrentMonth: boolean;
      events: OrganizerEvent[];
    }> = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const monthNum = currentMonth === 0 ? 12 : currentMonth;
      const yearNum = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        day: d,
        isCurrentMonth: false,
        events: []
      });
    }

    // Current month days
    for (let d = 1; d <= numDays; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvts = filteredEvents.filter(e => {
        if (!e.startDate) return false;
        const start = e.startDate;
        const end = e.endDate || e.startDate;
        return dateStr >= start && dateStr <= end;
      });

      days.push({
        dateStr,
        day: d,
        isCurrentMonth: true,
        events: dayEvts
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const monthNum = currentMonth === 11 ? 1 : currentMonth + 2;
      const yearNum = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        day: i,
        isCurrentMonth: false,
        events: []
      });
    }

    return days;
  }, [currentYear, currentMonth, filteredEvents]);

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const effectiveSelectedDateStr = selectedDateStr || todayKey;

  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter(e => {
      if (!e.startDate) return false;
      const start = e.startDate;
      const end = e.endDate || e.startDate;
      return effectiveSelectedDateStr >= start && effectiveSelectedDateStr <= end;
    });
  }, [filteredEvents, effectiveSelectedDateStr]);

  const getStatusLabel = (status: OrganizerEvent['status']) => {
    switch (status) {
      case 'happening':
        return language === 'vi' ? 'Đang diễn ra' : 'Happening';
      case 'upcoming':
        return language === 'vi' ? 'Sắp diễn ra' : 'Upcoming';
      case 'completed':
        return language === 'vi' ? 'Đã kết thúc' : 'Completed';
      case 'draft':
        return language === 'vi' ? 'Bản nháp' : 'Draft';
      default:
        return status;
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="event-mgmt-view">
      {/* 1. Header with Title & Action Buttons */}
      <div className="event-mgmt-header">
        <div className="event-mgmt-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AdminPageHeading section="events" language={language} />
          </div>
        </div>

        <div className="event-mgmt-actions">

          <button
            type="button"
            className="btn-create-event"
            onClick={onOpenCreateEvent}
          >
            <Plus size={16} />
            <span>{language === 'vi' ? 'Đăng ký sự kiện mới' : 'Register New Event'}</span>
          </button>
        </div>
      </div>

      {/* 2. Apple-Style Full-Width Calendar Card */}
      <div className="event-calendar-card">
        {/* Calendar Toolbar: Month Title, Navigation, Filter Tabs & Search */}
        <div className="cal-nav-header">
          <div className="cal-nav-title-group">
            <h2 className="cal-nav-month-title">
              {language === 'vi' ? monthNamesVi[currentMonth] : monthNamesEn[currentMonth]} <span>{currentYear}</span>
            </h2>

            {/* Segmented Month Navigation */}
            <div className="cal-nav-arrows">
              <button
                type="button"
                className="cal-nav-arrow-btn"
                onClick={handlePrevMonth}
                aria-label="Tháng trước"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="cal-nav-arrow-btn"
                onClick={handleNextMonth}
                aria-label="Tháng sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Quick Filter Tabs & Search */}
          <div className="cal-nav-filters-wrap">
            {/* Filter Pills */}
            <div className="event-status-pills">
              <button
                type="button"
                className={`event-status-pill ${activeStatusFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setActiveStatusFilter('all')}
              >
                {language === 'vi' ? 'Tất cả sự kiện' : 'All'}
              </button>
              <button
                type="button"
                className={`event-status-pill ${activeStatusFilter === 'happening' ? 'is-active' : ''}`}
                onClick={() => setActiveStatusFilter('happening')}
              >
                {language === 'vi' ? 'Đang diễn ra' : 'Happening'}
              </button>
              <button
                type="button"
                className={`event-status-pill ${activeStatusFilter === 'upcoming' ? 'is-active' : ''}`}
                onClick={() => setActiveStatusFilter('upcoming')}
              >
                {language === 'vi' ? 'Sắp tới' : 'Upcoming'}
              </button>
              <button
                type="button"
                className={`event-status-pill ${activeStatusFilter === 'completed' ? 'is-active' : ''}`}
                onClick={() => setActiveStatusFilter('completed')}
              >
                {language === 'vi' ? 'Đã kết thúc' : 'Completed'}
              </button>
            </div>

            {/* Search Input */}
            <div className="event-search-box" style={{ width: '220px' }}>
              <Search size={15} color="#6d847c" />
              <input maxLength={200}
                type="text"
                placeholder={language === 'vi' ? 'Tìm tên sự kiện...' : 'Search event...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} color="#6d847c" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Weekday Header */}
        <div className="cal-grid-weekdays">
          <div><span className="cal-weekday-desktop">{language === 'vi' ? 'Thứ 2' : 'Mon'}</span><span className="cal-weekday-mobile">T2</span></div>
          <div><span className="cal-weekday-desktop">{language === 'vi' ? 'Thứ 3' : 'Tue'}</span><span className="cal-weekday-mobile">T3</span></div>
          <div><span className="cal-weekday-desktop">{language === 'vi' ? 'Thứ 4' : 'Wed'}</span><span className="cal-weekday-mobile">T4</span></div>
          <div><span className="cal-weekday-desktop">{language === 'vi' ? 'Thứ 5' : 'Thu'}</span><span className="cal-weekday-mobile">T5</span></div>
          <div><span className="cal-weekday-desktop">{language === 'vi' ? 'Thứ 6' : 'Fri'}</span><span className="cal-weekday-mobile">T6</span></div>
          <div><span className="cal-weekday-desktop">{language === 'vi' ? 'Thứ 7' : 'Sat'}</span><span className="cal-weekday-mobile">T7</span></div>
          <div style={{ color: '#DC2626' }}><span className="cal-weekday-desktop">{language === 'vi' ? 'Chủ nhật' : 'Sun'}</span><span className="cal-weekday-mobile">CN</span></div>
        </div>

        {/* Calendar Days Grid */}
        <div className="cal-grid-cells">
          {calendarDays.map((cell, idx) => {
            const hasEvents = cell.events.length > 0;
            const isSelected = effectiveSelectedDateStr === cell.dateStr;
            const isToday = cell.dateStr === todayKey;
            const isPastDate = cell.dateStr < todayKey;
            const visibleEvents = cell.events.slice(0, 2);
            const extraCount = cell.events.length - 2;

            return (
              <div
                key={`${cell.dateStr}-${idx}`}
                className={`cal-cell ${!cell.isCurrentMonth ? 'is-outside' : ''} ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''} ${hasEvents ? 'has-events' : ''} ${isPastDate ? 'is-past-date' : ''}`}
                style={{
                  ...(isToday ? {
                    background: '#F4F9F6',
                    border: '2.5px solid #17382E',
                    boxShadow: '0 4px 16px rgba(23, 56, 46, 0.14)'
                  } : (isSelected ? {
                    border: '1.5px solid #648A7D'
                  } : {})),
                  cursor: isPastDate ? (hasEvents ? 'pointer' : 'not-allowed') : 'pointer',
                  opacity: isPastDate && !cell.isCurrentMonth ? 0.35 : (isPastDate && !hasEvents ? 0.65 : 1)
                }}
                onClick={() => {
                  setSelectedDateStr(cell.dateStr);
                  if (window.innerWidth > 768) {
                    if (!isPastDate) {
                      onOpenCreateEvent();
                    } else if (hasEvents) {
                      setDayOverviewModal({ dateStr: cell.dateStr, day: cell.day, events: cell.events });
                    }
                  }
                }}
                title={isPastDate ? (hasEvents ? (language === 'vi' ? 'Ngày đã diễn ra - Bấm để xem các sự kiện' : 'Past date - Click to view events') : (language === 'vi' ? 'Ngày đã qua - Không thể tạo sự kiện mới' : 'Past date - Cannot add new event')) : undefined}
              >
                {/* Cell Header: Day Number & Event Indicators */}
                <div className="cal-cell-head">
                  <div className="cal-cell-day-num-wrap">
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
                      <span className="cal-cell-day-num">
                        {cell.day}
                      </span>
                    )}
                  </div>

                  {hasEvents ? (
                    <span 
                      className="cal-cell-badge-desktop"
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
                    >
                      {cell.events.length} {language === 'vi' ? 'sự kiện' : 'events'}
                    </span>
                  ) : (
                    <span 
                      className="cal-cell-empty-text cal-cell-empty-text-desktop"
                      title={isPastDate ? (language === 'vi' ? 'Ngày đã qua' : 'Past date') : (language === 'vi' ? 'Bấm để tạo sự kiện mới' : 'Click to add event')}
                      style={{ color: '#CBD5E1', fontSize: '0.7rem' }}
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

                {/* Stacked Event Items inside Cell (Desktop) */}
                <div className="cal-cell-events cal-cell-events-desktop" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {visibleEvents.map((evt) => {
                    const statusColor = getEventStatusColor(evt.status);
                    const timeText = evt.dateRange ? evt.dateRange.split('•')[1]?.trim() || '' : '';
                    return (
                      <div
                        key={evt.id}
                        style={{
                          borderRadius: '6px',
                          background: '#FFFFFF',
                          border: '1px solid #EAEFEA',
                          borderLeft: `3px solid ${statusColor}`,
                          padding: '4px 6px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          transition: 'all 120ms ease',
                          cursor: 'pointer',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                        title={`${evt.title} • ${evt.dateRange || evt.startDate} (${getStatusLabel(evt.status)})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewEvent(evt);
                        }}
                      >
                        <div style={{
                          fontSize: '0.66rem',
                          fontWeight: 750,
                          color: statusColor,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Clock size={10} />
                          <span>{timeText}</span>
                        </div>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          lineHeight: 1.3,
                          color: '#172421',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word'
                        }}>
                          {evt.title}
                        </span>
                      </div>
                    );
                  })}

                  {/* + Xem thêm indicator */}
                  {extraCount > 0 && (
                    <button
                      type="button"
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
                        width: '100%',
                        transition: 'background 120ms ease'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDayOverviewModal({ dateStr: cell.dateStr, day: cell.day, events: cell.events });
                      }}
                    >
                      + Xem thêm {extraCount} {language === 'vi' ? 'sự kiện...' : 'more...'}
                    </button>
                  )}
                </div>
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
                    const parts = effectiveSelectedDateStr.split('-');
                    if (parts.length === 3) {
                      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                      const dayNameVi = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()];
                      const dayNameEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
                      return language === 'vi' 
                        ? `${dayNameVi}, ngày ${parts[2]}/${parts[1]}/${parts[0]}`
                        : `${dayNameEn}, ${parts[2]}/${parts[1]}/${parts[0]}`;
                    }
                  } catch {}
                  return effectiveSelectedDateStr;
                })()}
              </span>
              <span className="agenda-count-badge">
                {selectedDayEvents.length} {language === 'vi' ? 'sự kiện' : 'events'}
              </span>
            </div>

            {effectiveSelectedDateStr >= todayKey && (
              <button
                type="button"
                className="agenda-propose-btn"
                onClick={() => onOpenCreateEvent()}
              >
                <Plus size={13} />
                <span>{language === 'vi' ? 'Đăng ký sự kiện mới' : 'Register new event'}</span>
              </button>
            )}
          </div>

          <div className="agenda-mobile-list">
            {selectedDayEvents.length === 0 ? (
              <div className="agenda-empty-state">
                <p>{language === 'vi' ? 'Không có sự kiện nào trong ngày này.' : 'No events scheduled for this date.'}</p>
                {effectiveSelectedDateStr >= todayKey && (
                  <button
                    type="button"
                    className="agenda-empty-add-btn"
                    onClick={() => onOpenCreateEvent()}
                  >
                    <Plus size={14} />
                    <span>{language === 'vi' ? 'Đăng ký sự kiện mới vào ngày này' : 'Register new event for this date'}</span>
                  </button>
                )}
              </div>
            ) : (
              selectedDayEvents.map(ev => {
                const statusColor = getEventStatusColor(ev.status);
                const timeText = ev.dateRange ? ev.dateRange.split('•')[1]?.trim() || '' : '';
                return (
                  <div 
                    key={ev.id} 
                    className="agenda-event-card"
                    style={{ borderLeftColor: statusColor }}
                    onClick={() => setPreviewEvent(ev)}
                  >
                    <div className="agenda-event-left">
                      <div className="agenda-event-time">
                        <Clock size={13} style={{ color: statusColor }} />
                        <span style={{ color: statusColor, fontWeight: 700 }}>{timeText || ev.startDate}</span>
                        <span className={`event-card-badge ${ev.status}`} style={{ fontSize: '0.68rem', padding: '1px 6px', marginLeft: '6px' }}>
                          {getStatusLabel(ev.status)}
                        </span>
                      </div>
                      <h4 className="agenda-event-title">{ev.title}</h4>
                      <div className="agenda-event-meta">
                        {ev.location && <span>📍 {ev.location}</span>}
                        {ev.boothOccupancy && <span>🏪 {ev.boothOccupancy}</span>}
                      </div>
                    </div>
                    <div className="agenda-event-right">
                      <ChevronRight size={18} className="agenda-chevron" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. POPUP MODAL: Thông tin chi tiết sự kiện (Event Details Modal) */}
      {previewEvent && (
        <div className="event-preview-modal-overlay" onClick={() => setPreviewEvent(null)}>
          <div className="event-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="event-preview-hero">
              <img
                src={previewEvent.imageUrl}
                alt={previewEvent.title}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <button
                type="button"
                className="event-preview-close"
                onClick={() => setPreviewEvent(null)}
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            <div className="event-preview-body">
              <span className={`event-card-badge ${previewEvent.status}`} style={{ display: 'inline-block', position: 'static', marginBottom: '0.65rem' }}>
                {getStatusLabel(previewEvent.status)}
              </span>

              <h3 className="event-preview-title">{previewEvent.title}</h3>

              <div className="event-card-meta" style={{ marginBottom: '1rem' }}>
                <div className="event-card-meta-item">
                  <CalendarIcon size={15} color="#6a8279" />
                  <span>{previewEvent.dateRange || `${previewEvent.startDate} — ${previewEvent.endDate}`}</span>
                </div>
                <div className="event-card-meta-item">
                  <MapPin size={15} color="#6a8279" />
                  <span>{previewEvent.location}</span>
                </div>
              </div>

              <p className="event-preview-desc">
                {previewEvent.description}
              </p>

              <div className="event-card-metrics">
                <div className="event-metric-box">
                  <Store size={16} color="#8c6519" style={{ margin: '0 auto 0.2rem' }} />
                  <strong>{previewEvent.boothOccupancy || `${previewEvent.boothsCount || 0}/${previewEvent.maxBooths || 0}`}</strong>
                  <small>{language === 'vi' ? 'Gian hàng' : 'Booths'}</small>
                </div>
                <div className="event-metric-box">
                  <Sparkles size={16} color="#0284c7" style={{ margin: '0 auto 0.2rem' }} />
                  <strong>{previewEvent.activitiesCount || 0}</strong>
                  <small>{language === 'vi' ? 'Hoạt động' : 'Activities'}</small>
                </div>
                <div className="event-metric-box">
                  <Users size={16} color="#16a34a" style={{ margin: '0 auto 0.2rem' }} />
                  <strong>{previewEvent.registrationsCount || 0}</strong>
                  <small>{language === 'vi' ? 'Lượt đăng ký' : 'Registrations'}</small>
                </div>
              </div>

              <div className="event-preview-actions">
                {onTogglePublishEvent && (
                  <button
                    type="button"
                    className="btn-event-secondary"
                    onClick={() => {
                      onTogglePublishEvent(previewEvent.id);
                      setPreviewEvent(prev => prev ? { ...prev, status: prev.status === 'draft' ? 'upcoming' : 'draft' } : null);
                    }}
                  >
                    {previewEvent.status === 'draft' ? <Eye size={15} /> : <EyeOff size={15} />}
                    <span>{previewEvent.status === 'draft' ? (language === 'vi' ? 'Công bố' : 'Publish') : (language === 'vi' ? 'Ẩn sự kiện' : 'Hide')}</span>
                  </button>
                )}

                {onEditEvent && (
                  <button
                    type="button"
                    className="btn-event-secondary"
                    onClick={() => {
                      onEditEvent(previewEvent);
                      setPreviewEvent(null);
                    }}
                  >
                    <Edit3 size={15} />
                    <span>{language === 'vi' ? 'Chỉnh sửa' : 'Edit'}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn-event-detail"
                  onClick={() => {
                    const id = previewEvent.id;
                    setPreviewEvent(null);
                    onSelectEvent(id);
                  }}
                >
                  <span>{language === 'vi' ? 'Xem chi tiết & Quản lý' : 'Manage Event'}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. POPUP MODAL: Danh sách sự kiện trong ngày (Day Overview Modal) */}
      {dayOverviewModal && (
        <div className="event-preview-modal-overlay" onClick={() => setDayOverviewModal(null)}>
          <div className="event-preview-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #eef2f0'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#172421', fontWeight: 800 }}>
                  {language === 'vi' ? `Sự kiện ngày ${formatDisplayDate(dayOverviewModal.dateStr)}` : `Events on ${formatDisplayDate(dayOverviewModal.dateStr)}`}
                </h3>
                <small style={{ color: '#637771', fontSize: '0.8rem' }}>
                  {dayOverviewModal.events.length} {language === 'vi' ? 'chương trình diễn ra' : 'programs scheduled'}
                </small>
              </div>
              <button
                type="button"
                className="event-preview-close"
                style={{ position: 'static', background: '#f1f5f3', color: '#17382e' }}
                onClick={() => setDayOverviewModal(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
              {dayOverviewModal.events.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: '#f8faf9',
                    borderRadius: '10px',
                    border: '1px solid #e2eae5',
                    borderLeft: `4px solid ${getEventStatusColor(evt.status)}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => {
                    setDayOverviewModal(null);
                    setPreviewEvent(evt);
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className={`event-card-badge ${evt.status}`} style={{ position: 'static', fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                        {getStatusLabel(evt.status)}
                      </span>
                      <small style={{ color: '#688279', fontSize: '0.75rem' }}>{evt.location}</small>
                    </div>
                    <strong style={{ fontSize: '0.88rem', color: '#172421', display: 'block', lineHeight: 1.3 }}>
                      {evt.title}
                    </strong>
                  </div>
                  <ArrowRight size={16} color="#8c6519" />
                </div>
              ))}
            </div>

            {(() => {
              const now = new Date();
              const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
              const isPastDate = dayOverviewModal.dateStr < todayKey;

              return (
                <div style={{ 
                  padding: '1rem 1.5rem', 
                  borderTop: '1px solid #eef2f0', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isPastDate ? 'flex-end' : 'space-between',
                  gap: '0.75rem'
                }}>
                  <button
                    type="button"
                    className="btn-event-secondary"
                    onClick={() => setDayOverviewModal(null)}
                  >
                    {language === 'vi' ? 'Đóng' : 'Close'}
                  </button>

                  {!isPastDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setDayOverviewModal(null);
                        onOpenCreateEvent();
                      }}
                      style={{
                        background: '#17382E',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.55rem 1.15rem',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(23, 56, 46, 0.2)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Plus size={16} />
                      <span>{language === 'vi' ? 'Thêm sự kiện vào ngày này' : 'Add Event to this Day'}</span>
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
