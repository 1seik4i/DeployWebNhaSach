import { useModalBehavior } from '../hooks/useModalBehavior';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { X, ChevronRight, Star, Ticket } from 'lucide-react';
import { IconEventTicket } from './CustomIcons';
import { EventCoverflow } from './ui/EventCoverflow';
import { EventFeedbackModal } from './EventFeedbackModal';
import { EventRegistrationModal } from './EventRegistrationModal';
import { EventItem, Language } from '../types';
import './EventsSection.css';

const parseEventDate = (value: string) => {
  const parts = value.includes('/') ? value.split('/') : value.split('-');
  if (parts.length !== 3) return null;

  const [first, second, third] = parts.map(Number);
  const [year, month, day] = value.includes('/') ? [third, second, first] : [first, second, third];
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfWeek = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
};

interface EventsSectionProps {
  language: Language;
  events?: EventItem[];
  isLoading?: boolean;
}

export const EventsSection: React.FC<EventsSectionProps> = ({ 
  language, 
  events = [],
  isLoading = false,
}) => {
  const [activeEventDetail, setActiveEventDetail] = useState<EventItem | null>(null);
  const [feedbackEvent, setFeedbackEvent] = useState<EventItem | null>(null);
  const [registeringEvent, setRegisteringEvent] = useState<EventItem | null>(null);
  const [closingSheet, setClosingSheet] = useState(false);

  useModalBehavior(Boolean(activeEventDetail), () => closeEventSheet());
  const sheetDragStartY = React.useRef<number | null>(null);
  const didSheetDrag = React.useRef(false);
  const [sheetDragOffset, setSheetDragOffset] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);

  const closeEventSheet = () => {
    if (closingSheet) return;
    const finishClose = () => {
      setActiveEventDetail(null);
      setSheetDragOffset(0);
      setClosingSheet(false);
    };

    if (!window.matchMedia('(max-width: 768px)').matches) {
      finishClose();
      return;
    }

    setClosingSheet(true);
    window.setTimeout(finishClose, 260);
  };

  React.useEffect(() => {
    if (!activeEventDetail) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      closeEventSheet();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeEventDetail]);

  const { displayedEvents, weekEventIds } = React.useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const weekStart = startOfWeek(today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Hiển thị tất cả sự kiện đang và sắp diễn ra từ hôm nay trở đi, hoặc danh sách sự kiện có sẵn
    const upcomingEvents = events.filter((event) => {
      if (event.status === 'happening' || (event as any).isOngoingToday) return true;
      const endParsed = (event as any).endDate ? parseEventDate((event as any).endDate) : ((event as any).endAt ? new Date((event as any).endAt) : null);
      if (endParsed && endParsed >= startOfToday) return true;
      const eventDate = parseEventDate(event.dateStr);
      if (!eventDate) return true;
      return eventDate >= startOfToday;
    });

    const activeEvents = upcomingEvents.length > 0 ? upcomingEvents : events;

    return {
      displayedEvents: activeEvents,
      weekEventIds: new Set(activeEvents.filter((event) => {
        const eventDate = parseEventDate(event.dateStr);
        return eventDate && eventDate >= weekStart && eventDate <= weekEnd;
      }).map((event) => event.id)),
    };
  }, [events]);

  return (
    <section className="figma-events-section" id="su-kien">
      <div className="container">
        {/* Figma Eyebrow & Title - Perfectly centered matching whole website */}
        <div className="figma-section-header">
          <span className="figma-eyebrow">
            <IconEventTicket size={16} color="var(--figma-gold)" />
            {language === 'vi' ? 'LỊCH HOẠT ĐỘNG' : 'EVENTS SCHEDULE'}
          </span>
          <h2 className="figma-section-title">
            {language === 'vi' ? (
              <>Sự kiện sắp diễn ra tại <span className="serif-italic-accent">Đường Sách</span></>
            ) : (
              'Upcoming Cultural Events'
            )}
          </h2>
          <p className="figma-section-subtitle">
            {language === 'vi'
              ? 'Tham gia các buổi tọa đàm tác giả, triển lãm văn học và workshop trải nghiệm sáng tạo.'
              : 'Join inspiring author talks, cultural book exhibitions, and hands-on creative workshops.'}
          </p>
        </div>

        <EventCoverflow
          events={displayedEvents}
          language={language}
          weekEventIds={weekEventIds}
          isLoading={isLoading}
          onDetails={setActiveEventDetail}
        />
        {/* Nút Xem thêm nhỏ không có khung viền đặt dưới danh sách sự kiện */}
        <div className="section-bottom-see-more-row">
          <Link
            to="/su-kien"
            className="btn-section-see-more-borderless"
            aria-label="Xem thêm toàn bộ lịch hoạt động sự kiện"
          >
            <span>{language === 'vi' ? 'Xem thêm toàn bộ lịch sự kiện & hoạt động tại Đường Sách' : 'View full events & activities schedule at Book Street'}</span>
            <ChevronRight size={17} className="see-more-arrow-icon" />
          </Link>
        </div>
      </div>

      {/* Event Detail Modal */}
      {activeEventDetail && createPortal(
        <div
          className="modal-overlay event-detail-modal-overlay"
          onClick={closeEventSheet}
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-detail-modal-title"
        >
          <div
            className={`modal-content event-detail-modal-content ${closingSheet ? 'is-closing' : ''}`}
            style={!closingSheet && (isSheetDragging || sheetDragOffset !== 0) ? { transform: `translateY(${sheetDragOffset}px)`, transition: isSheetDragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)' } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="event-sheet-handle"
              aria-label={language === 'vi' ? 'Kéo xuống để đóng chi tiết sự kiện' : 'Drag down to close event details'}
              onClick={() => { if (!didSheetDrag.current) closeEventSheet(); }}
              onPointerDown={(event) => {
                sheetDragStartY.current = event.clientY;
                didSheetDrag.current = false;
                setIsSheetDragging(true);
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (sheetDragStartY.current === null) return;
                const distance = event.clientY - sheetDragStartY.current;
                if (Math.abs(distance) > 3) didSheetDrag.current = true;
                setSheetDragOffset(Math.max(-72, Math.min(distance, window.innerHeight * 0.82)));
              }}
              onPointerUp={(event) => {
                if (sheetDragStartY.current === null) return;
                const distance = event.clientY - sheetDragStartY.current;
                sheetDragStartY.current = null;
                setIsSheetDragging(false);
                if (distance > 120) closeEventSheet();
                else setSheetDragOffset(0);
                window.setTimeout(() => { didSheetDrag.current = false; }, 0);
              }}
              onPointerCancel={() => { sheetDragStartY.current = null; setIsSheetDragging(false); setSheetDragOffset(0); }}
            ><span aria-hidden="true" /></button>
            <button
              type="button"
              className="modal-close"
              onClick={closeEventSheet}
              aria-label={language === 'vi' ? 'Đóng chi tiết sự kiện' : 'Close event details'}
            >
              <X size={20} />
            </button>
            <div className="modal-event-photo-header">
              <img src={activeEventDetail.image.url} alt={activeEventDetail.image.alt} className="modal-top-img" />
              <div className="modal-img-caption">
                <span className="event-cat-tag">
                  {language === 'vi' ? activeEventDetail.typeLabelVi : activeEventDetail.typeLabelEn}
                </span>
              </div>
            </div>
            <h3 className="modal-heading-title" id="event-detail-modal-title">
              {language === 'vi' ? activeEventDetail.title : activeEventDetail.titleEn}
            </h3>
            <div className="modal-meta-box">
              <p><strong>{language === 'vi' ? 'Thời gian:' : 'Time:'}</strong> {activeEventDetail.dateRange || activeEventDetail.dateStr} ({activeEventDetail.timeStr})</p>
              <p><strong>{language === 'vi' ? 'Địa điểm:' : 'Location:'}</strong> {language === 'vi' ? activeEventDetail.location : activeEventDetail.locationEn}</p>
              <p><strong>{language === 'vi' ? 'Diễn giả:' : 'Speaker:'}</strong> {activeEventDetail.speaker}</p>
            </div>
            <p className="modal-body-desc">
              {language === 'vi' ? activeEventDetail.summary : activeEventDetail.summaryEn}
            </p>
            <div className="modal-event-buttons-row">
              <button
                type="button"
                className="btn-event-register-primary"
                onClick={() => {
                  const e = activeEventDetail;
                  setActiveEventDetail(null);
                  setRegisteringEvent(e);
                }}
              >
                <Ticket size={18} />
                <span>{language === 'vi' ? 'Đăng ký tham gia sự kiện' : 'Register for Event'}</span>
              </button>

              <button
                type="button"
                className="btn-event-feedback-trigger"
                onClick={() => {
                  const e = activeEventDetail;
                  setActiveEventDetail(null);
                  setFeedbackEvent(e);
                }}
              >
                <Star size={18} className="star-icon-feedback" />
                <span>{language === 'vi' ? 'Đánh giá sự kiện' : 'Đánh giá sự kiện'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* Event Feedback Modal */}
      <EventRegistrationModal
        isOpen={Boolean(registeringEvent)}
        event={registeringEvent}
        onClose={() => setRegisteringEvent(null)}
        language={language}
      />

      <EventFeedbackModal
        isOpen={Boolean(feedbackEvent)}
        event={feedbackEvent}
        onClose={() => setFeedbackEvent(null)}
        language={language}
      />
    </section>
  );
};
