import { useModalBehavior } from '../hooks/useModalBehavior';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight,
  Search, 
  X, 
  Ticket,
  Star
} from 'lucide-react';
import { EventFeedbackModal } from '../components/EventFeedbackModal';
import { EventRegistrationModal } from '../components/EventRegistrationModal';
import { EventItem, Language } from '../types';
import './ExperienceShell.css';
import './EventsExperience.css';

interface EventsExperienceProps {
  language: Language;
  open: boolean;
  events: EventItem[];
}

export const EventsExperience: React.FC<EventsExperienceProps> = ({
  language,
  open,
  events,
}) => {
  const vi = language === 'vi';
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [activeModalEvent, setActiveModalEvent] = useState<EventItem | null>(null);

  useModalBehavior(Boolean(activeModalEvent), () => setActiveModalEvent(null));
  const [feedbackEvent, setFeedbackEvent] = useState<EventItem | null>(null);
  const [registeringEvent, setRegisteringEvent] = useState<EventItem | null>(null);

  // Prevent background scroll when sheet is open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const eventTypes = [
    { id: 'all', labelVi: 'Tất cả sự kiện', labelEn: 'All Events', count: events.length },
    { id: 'talkshow', labelVi: 'Tọa đàm & Giao lưu', labelEn: 'Talkshows & Panels', count: events.filter(e => e.type === 'talkshow').length },
    { id: 'launch', labelVi: 'Ra mắt sách mới', labelEn: 'Book Launches', count: events.filter(e => e.type === 'launch').length },
    { id: 'workshop', labelVi: 'Workshop & Lễ hội', labelEn: 'Workshops & Festivals', count: events.filter(e => e.type === 'workshop').length },
  ];

  const featuredEvent = events[0];

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchType = selectedType === 'all' || evt.type === selectedType;
      const q = searchQuery.trim().normalize('NFC').toLocaleLowerCase('vi-VN');
      const matchSearch =
        !q ||
        evt.title.toLowerCase().includes(q) ||
        (evt.titleEn && evt.titleEn.toLowerCase().includes(q)) ||
        evt.summary.toLowerCase().includes(q) ||
        (evt.speaker && evt.speaker.toLowerCase().includes(q)) ||
        (evt.boothName && evt.boothName.toLowerCase().includes(q));

      return matchType && matchSearch;
    });
  }, [events, searchQuery, selectedType]);

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div
      ref={panelRef}
      id="events-page-panel"
      className={`heritage-sheet events-experience-sheet ${open ? 'is-open' : ''}`}
      inert={!open}
      aria-hidden={!open || undefined}
    >
      <main className="heritage-document">
        {/* Editorial Collection Hero */}
        <section className="heritage-collection-hero">
          <div className="heritage-inner heritage-hero-grid">
            <div className="heritage-introduction">
              <button
                type="button"
                className="exp-btn-return-frameless"
                onClick={handleClose}
                aria-label={vi ? 'Trở về trang chủ Đường Sách' : 'Return to Book Street home'}
              >
                <ArrowLeft size={16} />
                <span>{vi ? 'Trở về trang chủ' : 'Back to Home'}</span>
              </button>

              <span className="heritage-kicker">
                <span />
                {vi ? 'Lịch hoạt động & Sự kiện' : 'Events Calendar & Activities'}
              </span>
              <h1 tabIndex={-1}>
                {vi ? (
                  <>
                    Hội ngộ tác giả.
                    <br />
                    Lắng nghe chuyện đời.
                  </>
                ) : (
                  <>
                    Meet inspiring authors.
                    <br />
                    Hear living stories.
                  </>
                )}
              </h1>
              <p>
                {vi
                  ? 'Tổng hợp đầy đủ các buổi giao lưu tác giả danh tiếng, ra mắt sách mới, đêm nhạc thơ acoustic và các workshop trải nghiệm nghệ thuật tại Đường Sách.'
                  : 'Complete program of author panel talks, book launches, acoustic poetry recitals and artisan workshops across Book Street stages.'}
              </p>

              <div className="heritage-hero-footnote">
                <strong>{events.length}</strong>
                <span>{vi ? 'hoạt động nổi bật' : 'upcoming events'}</span>
                <i />
                <Ticket size={17} />
                <span>{vi ? 'Tham gia sự kiện' : 'Join Event'}</span>
              </div>
            </div>

            {/* Featured Showcase Card on the right */}
            {featuredEvent && (
              <div
                className="heritage-featured"
                onClick={() => setActiveModalEvent(featuredEvent)}
                role="button"
                tabIndex={0}
                aria-label={`Khám phá ${featuredEvent.title}`}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src={featuredEvent.image.url}
                  alt={featuredEvent.image.alt}
                  fetchPriority="high"
                />
                <span className="heritage-image-ribbon">
                  {featuredEvent.isOngoingToday || featuredEvent.status === 'happening' ? (vi ? 'HÔM NAY' : 'TODAY') : '★'}
                </span>
                <div>
                  <span>
                    {featuredEvent.isOngoingToday || featuredEvent.status === 'happening'
                      ? (vi ? '🔥 Đang diễn ra hôm nay' : '🔥 Happening Today')
                      : (vi ? 'Sự kiện tâm điểm' : 'Spotlight Event')}
                  </span>
                  <h2>{vi ? featuredEvent.title : featuredEvent.titleEn}</h2>
                  <span>{featuredEvent.dayOfWeek}, {featuredEvent.dateRange || featuredEvent.dateStr} ({featuredEvent.timeStr})</span>
                </div>
                <ArrowRight className="heritage-featured-arrow" size={24} />
              </div>
            )}
          </div>
        </section>

        {/* Events Collection Grid Section */}
        <section className="heritage-inner heritage-collection" id="events-collection">
          <div className="heritage-collection-title">
            <div>
              <span className="heritage-section-marker">
                {vi ? 'Lịch trình văn hóa' : 'Cultural Schedule'}
              </span>
              <h2>{vi ? 'Danh mục các sự kiện' : 'All Events & Talks'}</h2>
            </div>
            <div className="heritage-search">
              <Search size={16} />
              <input maxLength={200}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={vi ? 'Tìm sự kiện, diễn giả, tọa đàm...' : 'Search event, speaker, launch...'}
                aria-label={vi ? 'Tìm kiếm sự kiện' : 'Search events'}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#66735e' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="heritage-filter-row">
            <div className="heritage-filters">
              {eventTypes.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  aria-pressed={selectedType === cat.id}
                  onClick={() => setSelectedType(cat.id)}
                >
                  {vi ? cat.labelVi : cat.labelEn} ({cat.count})
                </button>
              ))}
            </div>
            <span>{vi ? `${filteredEvents.length} sự kiện` : `${filteredEvents.length} events`}</span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="heritage-empty-result">
              <p>{vi ? 'Không tìm thấy sự kiện phù hợp với từ khóa.' : 'No events matched your query.'}</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                }}
              >
                {vi ? 'Xem lại tất cả sự kiện' : 'Reset search & filters'}
              </button>
            </div>
          ) : (
            <div className="events-collection-grid">
              {filteredEvents.map((evt) => {
                const isToday = Boolean(evt.isOngoingToday || evt.status === 'happening');
                return (
                  <article 
                    key={evt.id} 
                    className="event-card-item"
                    onClick={() => setActiveModalEvent(evt)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="event-card-image">
                      <img src={evt.image.url} alt={evt.title} />
                      {isToday && (
                        <span className="event-card-today-badge">
                          {vi ? 'Hôm nay' : 'Today'}
                        </span>
                      )}
                      <span className="event-datetime-badge">{evt.dateRange || evt.dateStr}</span>
                    </div>
                    <div className="event-card-body">
                      <div className="event-badge-row">
                        <span className="heritage-card-cat">
                          {vi ? evt.typeLabelVi : evt.typeLabelEn}
                        </span>
                        {evt.boothName && (
                          <span className="event-booth-pill">{evt.boothName}</span>
                        )}
                      </div>
                      <h3 className="event-card-title">{vi ? evt.title : evt.titleEn}</h3>
                      <p className="heritage-card-loc">📍 {vi ? evt.location : evt.locationEn}</p>
                      <p className="heritage-card-summary">{vi ? evt.summary : evt.summaryEn}</p>
                      <div className="event-card-footer">
                        <span className="heritage-card-arrow-text">
                          {vi ? 'Xem chi tiết' : 'View details'}
                        </span>
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="heritage-sheet-footer">
          <span>
            ĐƯỜNG SÁCH <span> / </span>
            {vi ? 'Lịch sự kiện & Tọa đàm' : 'Events & Activities Calendar'}
          </span>
        </footer>

        {/* Event Detail Modal — rendered via Portal */}
        {activeModalEvent && createPortal(
          <div className="modal-overlay events-detail-modal-overlay" onClick={() => setActiveModalEvent(null)} role="dialog" aria-modal="true">
            <div className="modal-content events-detail-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setActiveModalEvent(null)} aria-label="Đóng">
                <X size={20} />
              </button>
              <div className="event-detail-scroll-body">
                <div className="modal-booth-header-img">
                  <img src={activeModalEvent.image.url} alt={activeModalEvent.image.alt} className="modal-top-img" />
                </div>
                <h3 className="modal-heading-title">
                  {vi ? activeModalEvent.title : activeModalEvent.titleEn}
                </h3>
                <div className="modal-meta-box">
                  <p>⏰ <strong>{vi ? 'Thời gian:' : 'Time:'}</strong> {activeModalEvent.timeStr} ({activeModalEvent.dayOfWeek}, {activeModalEvent.dateRange || activeModalEvent.dateStr})</p>
                  <p>📍 <strong>{vi ? 'Địa điểm:' : 'Location:'}</strong> {vi ? activeModalEvent.location : activeModalEvent.locationEn}</p>
                  {activeModalEvent.speaker && (
                    <p>🎙️ <strong>{vi ? 'Diễn giả / Chủ trì:' : 'Speaker:'}</strong> {activeModalEvent.speaker}</p>
                  )}
                  {activeModalEvent.boothName && (
                    <p>🏛️ <strong>{vi ? 'Đơn vị tổ chức:' : 'Organizer:'}</strong> {activeModalEvent.boothName}</p>
                  )}
                </div>
                <p className="modal-body-desc">
                  {vi ? activeModalEvent.summary : activeModalEvent.summaryEn}
                </p>
              </div>
              <div className="modal-event-buttons-row">
                <button
                  type="button"
                  className="btn-event-register-primary"
                  onClick={() => {
                    const ev = activeModalEvent;
                    setActiveModalEvent(null);
                    setRegisteringEvent(ev);
                  }}
                >
                  <Ticket size={18} />
                  <span>{vi ? 'Đăng ký tham gia sự kiện' : 'Register for Event'}</span>
                </button>

                <button
                  type="button"
                  className="btn-event-feedback-trigger"
                  onClick={() => {
                    const ev = activeModalEvent;
                    setActiveModalEvent(null);
                    setFeedbackEvent(ev);
                  }}
                >
                  <Star size={18} className="star-icon-feedback" />
                  <span>{vi ? 'Đánh giá sự kiện' : 'Rate Event'}</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Event Registration Modal */}
        <EventRegistrationModal
          isOpen={Boolean(registeringEvent)}
          event={registeringEvent}
          onClose={() => setRegisteringEvent(null)}
          language={language}
        />

        {/* Event Feedback Modal */}
        <EventFeedbackModal
          isOpen={Boolean(feedbackEvent)}
          event={feedbackEvent}
          onClose={() => setFeedbackEvent(null)}
          language={language}
        />
      </main>
    </div>
  );
};
