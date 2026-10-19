import { useModalBehavior } from '../hooks/useModalBehavior';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Ticket, X, CheckCircle2, Calendar, MapPin, Users, Phone, Mail, User, Clock, QrCode } from 'lucide-react';
import { EventItem, Language } from '../types';
import { publicApi, EventRegistrationResult } from '../services/publicApi';
import './EventRegistrationModal.css';

interface EventRegistrationModalProps {
  isOpen: boolean;
  event: EventItem | null;
  onClose: () => void;
  language?: Language;
}

export const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  isOpen,
  event,
  onClose,
  language = 'vi',
}) => {
  const vi = language === 'vi';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [attendeesCount, setAttendeesCount] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registrationResult, setRegistrationResult] = useState<EventRegistrationResult | null>(null);

  useModalBehavior(isOpen && Boolean(event), () => handleResetAndClose(), isSubmitting);

  if (!isOpen || !event) return null;

  const handleResetAndClose = () => {
    setRegistrationResult(null);
    setIsSubmitting(false);
    setErrorMsg('');
    setFullName('');
    setEmail('');
    setPhone('');
    setAttendeesCount(1);
    setNotes('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg(vi ? 'Vui lòng điền đầy đủ Họ tên, Email và Số điện thoại.' : 'Please enter your Full Name, Email and Phone.');
      return;
    }
    if (!/^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u.test(fullName.trim()) || fullName.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !/^(?:\+?84|0)(?:3|5|7|8|9)\d{8}$/.test(phone.replace(/[\s.-]/g, ''))) {
      setErrorMsg(vi ? 'Họ tên, email hoặc số điện thoại Việt Nam không hợp lệ.' : 'Invalid name, email or Vietnamese phone number.');
      return;
    }
    if (!Number.isInteger(attendeesCount) || attendeesCount < 1 || attendeesCount > 2147483647 || notes.length > 5000) {
      setErrorMsg(vi ? 'Số người tham dự hoặc ghi chú không hợp lệ.' : 'Invalid attendee count or notes.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const result = await publicApi.registerEvent(event.id, {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/[\s.-]/g, ''),
        attendeesCount,
        notes: notes.trim() || undefined,
      });

      setRegistrationResult(result);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : (vi ? 'Không thể hoàn tất đăng ký. Vui lòng thử lại sau.' : 'Failed to complete registration.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="modal-overlay reg-modal-overlay"
      onClick={handleResetAndClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-reg-modal-title"
    >
      <div
        className="modal-content reg-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={handleResetAndClose}
          aria-label={vi ? 'Đóng form đăng ký' : 'Close registration'}
        >
          <X size={20} />
        </button>

        {registrationResult ? (
          /* Success Screen with Ticket */
          <div className="reg-success-view">
            <div className="reg-success-icon-wrap">
              <CheckCircle2 size={44} color="#15803D" />
            </div>

            <h3 className="reg-success-title">
              {vi ? 'Đăng ký tham gia thành công!' : 'Registration Successful!'}
            </h3>
            <p className="reg-success-subtitle">
              {vi
                ? 'Thông tin vé của bạn đã được ghi nhận. Hệ thống đã gửi thông báo đến Ban Quản Lý sự kiện.'
                : 'Your registration ticket is confirmed. Organizer has been notified.'}
            </p>

            <div className="reg-ticket-card">
              <div className="reg-ticket-header">
                <span className="reg-ticket-tag">{vi ? 'VÉ THAM DỰ SỰ KIỆN' : 'EVENT PASS'}</span>
                <span className="reg-ticket-code">{registrationResult.registrationCode}</span>
              </div>

              <h4 className="reg-ticket-event-title">{registrationResult.eventTitle}</h4>

              <div className="reg-ticket-grid">
                <div className="reg-ticket-item">
                  <span className="reg-ticket-label">{vi ? 'Họ và tên' : 'Attendee'}</span>
                  <span className="reg-ticket-val">{registrationResult.fullName}</span>
                </div>
                <div className="reg-ticket-item">
                  <span className="reg-ticket-label">{vi ? 'Số người' : 'Quantity'}</span>
                  <span className="reg-ticket-val">{registrationResult.attendeesCount} {vi ? 'người' : 'pax'}</span>
                </div>
                <div className="reg-ticket-item">
                  <span className="reg-ticket-label">{vi ? 'Thời gian' : 'Time'}</span>
                  <span className="reg-ticket-val">{event.timeStr} · {event.dateRange || event.dateStr}</span>
                </div>
                <div className="reg-ticket-item">
                  <span className="reg-ticket-label">{vi ? 'Địa điểm' : 'Location'}</span>
                  <span className="reg-ticket-val">{event.location}</span>
                </div>
              </div>

              <div className="reg-ticket-qr-section">
                <div className="reg-ticket-qr-box">
                  <QrCode size={52} color="#182924" />
                </div>
                <div className="reg-ticket-qr-hint">
                  <strong>{vi ? 'Mã số Check-in:' : 'Check-in Token:'}</strong> {registrationResult.registrationCode}
                  <br />
                  <small>{vi ? 'Xuất trình vé tại khu vực bàn đón tiếp sự kiện.' : 'Present this code at the event entrance.'}</small>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-reg-done"
              onClick={handleResetAndClose}
            >
              {vi ? 'Hoàn tất & Đóng' : 'Done & Close'}
            </button>
          </div>
        ) : (
          /* Registration Form */
          <div className="reg-form-view">
            <div className="reg-header">
              <div className="reg-header-badge">
                <Ticket size={16} />
                <span>{vi ? 'ĐĂNG KÝ THAM GIA' : 'EVENT REGISTRATION'}</span>
              </div>
              <h3 id="event-reg-modal-title" className="reg-title">
                {event.title}
              </h3>
              <div className="reg-event-meta-bar">
                <span><Calendar size={14} /> {event.dateRange || event.dateStr}</span>
                <span><Clock size={14} /> {event.timeStr}</span>
                <span><MapPin size={14} /> {event.location}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="reg-error-banner">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="reg-form">
              <div className="reg-input-group">
                <label className="reg-label">
                  <User size={14} />
                  <span>{vi ? 'Họ và tên người đại diện *' : 'Full Name *'}</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={vi ? 'Ví dụ: Nguyễn Văn A' : 'e.g. John Doe'}
                  minLength={2}
                  maxLength={160}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="reg-input"
                />
              </div>

              <div className="reg-grid-2">
                <div className="reg-input-group">
                  <label className="reg-label">
                    <Mail size={14} />
                    <span>Email *</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="reg-input"
                  />
                </div>

                <div className="reg-input-group">
                  <label className="reg-label">
                    <Phone size={14} />
                    <span>{vi ? 'Số điện thoại *' : 'Phone *'}</span>
                  </label>
                  <input maxLength={40}
                    type="tel"
                    required
                    placeholder={vi ? '0901 234 567' : '+84 901 234 567'}
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="reg-input"
                  />
                </div>
              </div>

              <div className="reg-input-group">
                <label className="reg-label">
                  <Users size={14} />
                  <span>{vi ? 'Số lượng người tham dự' : 'Number of Attendees'}</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={2147483647}
                  step={1}
                  required
                  value={attendeesCount}
                  onChange={(e) => setAttendeesCount(Number(e.target.value))}
                  className="reg-input"
                />
              </div>

              <div className="reg-input-group">
                <label className="reg-label">
                  <span>{vi ? 'Ghi chú / Yêu cầu thêm (Tùy chọn)' : 'Notes / Requests (Optional)'}</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={5000}
                  placeholder={vi ? 'Ví dụ: Đăng ký kèm chỗ ngồi trẻ em...' : 'Special requirements...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="reg-input reg-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-reg-submit"
              >
                {isSubmitting ? (
                  <span>{vi ? 'Đang gửi đăng ký...' : 'Registering...'}</span>
                ) : (
                  <>
                    <Ticket size={17} />
                    <span>{vi ? 'Xác nhận Đăng ký tham gia' : 'Confirm Registration'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
