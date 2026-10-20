import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from 'lucide-react';
import type { EventItem, Language } from '../../types';
import { EventCoverflowSkeleton } from './SkeletonCard';
import './EventCoverflow.css';

interface EventCoverflowProps {
  events: EventItem[];
  language: Language;
  weekEventIds: Set<string>;
  isLoading?: boolean;
  onDetails: (event: EventItem) => void;
}

export function EventCoverflow({ events, language, weekEventIds, isLoading = false, onDetails }: EventCoverflowProps) {
  const [selected, setSelected] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const dragStart = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const count = events.length;
  const current = events[Math.min(selected, count - 1)];

  useEffect(() => {
    if (selected >= count && count > 0) setSelected(0);
  }, [count, selected]);

  // Tự động chuyển thẻ sau 3 giây (tạm dừng khi hover hoặc kéo)
  useEffect(() => {
    if (count <= 1 || isPaused) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setSelected((index) => (index + 1) % count);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [count, isPaused, selected]);

  const move = (step: number) => {
    if (count > 1) setSelected((index) => (index + step + count) % count);
  };

  const offsetFor = (index: number) => {
    let offset = index - selected;
    if (offset > count / 2) offset -= count;
    if (offset < -count / 2) offset += count;
    return offset;
  };

  if (isLoading) {
    return <EventCoverflowSkeleton />;
  }

  if (!current) {
    return <p className="event-coverflow-empty">{language === 'vi' ? 'Chưa có sự kiện nào.' : 'No events yet.'}</p>;
  }

  return (
    <div
      className="event-coverflow"
      role="region"
      aria-roledescription="carousel"
      aria-label={language === 'vi' ? 'Sự kiện nổi bật' : 'Featured events'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="event-coverflow-stage-wrap">
        <button type="button" className="event-coverflow-arrow" onClick={() => move(-1)} disabled={count < 2} aria-label={language === 'vi' ? 'Sự kiện trước' : 'Previous event'} title={language === 'vi' ? 'Sự kiện trước' : 'Previous event'}>
          <ChevronLeft size={23} />
        </button>
        <div
          className="event-coverflow-stage"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
            if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
          }}
          onPointerDown={(event) => {
            dragStart.current = event.clientX;
            suppressClick.current = false;
            setIsPaused(true);
          }}
          onPointerUp={(event) => {
            if (dragStart.current !== null) {
              const distance = event.clientX - dragStart.current;
              if (Math.abs(distance) > 35) {
                suppressClick.current = true;
                move(distance < 0 ? 1 : -1);
              }
            }
            dragStart.current = null;
            setIsPaused(false);
          }}
          onPointerCancel={() => {
            dragStart.current = null;
            setIsPaused(false);
          }}
        >
          {events.map((event, index) => {
            const offset = offsetFor(index);
            const distance = Math.abs(offset);
            const visible = distance <= 2;
            const isToday = Boolean(event.isOngoingToday || event.status === 'happening');
            return (
              <button
                key={event.id}
                type="button"
                className={`event-coverflow-slide ${index === selected ? 'is-selected' : ''}`}
                style={{
                  transform: `translateX(calc(-50% + ${offset * 80}%)) translateZ(${-distance * 180}px) rotateY(${-Math.sign(offset) * Math.min(distance * 32, 58)}deg) scale(${distance === 0 ? 1.08 : distance === 1 ? 0.92 : 0.82})`,
                  opacity: visible ? (distance === 0 ? 1 : distance === 1 ? 0.55 : 0.3) : 0,
                  filter: distance === 0 ? 'none' : `blur(${distance === 1 ? 1.5 : 3}px) saturate(0.75)`,
                  zIndex: 10 - distance,
                  pointerEvents: visible ? 'auto' : 'none',
                }}
                onClick={(clickEvent) => {
                  if (suppressClick.current) {
                    clickEvent.preventDefault();
                    suppressClick.current = false;
                    return;
                  }
                  if (index === selected) onDetails(event);
                  else setSelected(index);
                }}
                aria-label={`${language === 'vi' ? event.title : event.titleEn}${index === selected ? '' : language === 'vi' ? ', chọn sự kiện' : ', select event'}`}
                aria-current={index === selected ? 'true' : undefined}
                tabIndex={visible ? 0 : -1}
              >
                <img src={event.image.url || undefined} alt={event.image.alt} draggable={false} loading={distance > 1 ? 'lazy' : 'eager'} />
                {isToday ? (
                  <span className="event-coverflow-today-badge">
                    {language === 'vi' ? 'Hôm nay' : 'Today'}
                  </span>
                ) : weekEventIds.has(event.id) ? (
                  <span className="event-coverflow-week-badge">
                    {language === 'vi' ? 'Trong tuần' : 'This week'}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <button type="button" className="event-coverflow-arrow" onClick={() => move(1)} disabled={count < 2} aria-label={language === 'vi' ? 'Sự kiện tiếp theo' : 'Next event'} title={language === 'vi' ? 'Sự kiện tiếp theo' : 'Next event'}>
          <ChevronRight size={23} />
        </button>
      </div>

      <div className="event-coverflow-details" aria-live="polite">
        <div key={current.id} className="event-coverflow-details-main">
          <div className="event-coverflow-kicker-row">
            <span className="event-coverflow-kicker">{language === 'vi' ? current.typeLabelVi : current.typeLabelEn}</span>
            {(current.isOngoingToday || current.status === 'happening') && (
              <span className="event-coverflow-today-pill">
                ● {language === 'vi' ? 'Đang diễn ra hôm nay' : 'Happening Today'}
              </span>
            )}
          </div>
          <h3>{language === 'vi' ? current.title : current.titleEn}</h3>
          <p>{(language === 'vi' ? current.summary : current.summaryEn) || (language === 'vi' ? 'Sự kiện văn hóa nghệ thuật và phát triển văn hóa đọc tại Đường Sách TP.HCM.' : 'Cultural and reading events at Ho Chi Minh City Book Street.')}</p>
          <div className="event-coverflow-meta">
            <span><CalendarDays size={16} />{current.dayOfWeek ? `${current.dayOfWeek}, ` : ''}{current.dateRange || current.dateStr}</span>
            <span><Clock3 size={16} />{current.timeStr}</span>
            <span className="event-coverflow-meta-location"><MapPin size={16} />{language === 'vi' ? current.location : current.locationEn}</span>
          </div>
        </div>
        <div className="event-coverflow-actions">
          <button type="button" className="event-coverflow-detail-btn" onClick={() => onDetails(current)}>
            <span>{language === 'vi' ? 'Xem chi tiết' : 'View details'}</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      {count > 1 && <div className="event-coverflow-pagination" aria-label={language === 'vi' ? 'Chọn sự kiện' : 'Choose event'}>
        {events.map((event, index) => <button key={event.id} type="button" className={index === selected ? 'is-selected' : ''} aria-label={`${language === 'vi' ? 'Sự kiện' : 'Event'} ${index + 1}`} aria-current={index === selected ? 'true' : undefined} onClick={() => setSelected(index)} />)}
      </div>}
    </div>
  );
}
