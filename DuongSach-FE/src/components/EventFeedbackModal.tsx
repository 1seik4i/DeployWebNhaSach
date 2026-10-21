import { recordGuestSubmission } from '../utils/guestSubmission';
import { useModalBehavior } from '../hooks/useModalBehavior';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Star, X, CheckCircle2, Send } from 'lucide-react';
import { EventItem, Language } from '../types';
import { publicApi } from '../services/publicApi';
import { feedbackContactError } from '../utils/feedbackContact';
import './EventFeedbackModal.css';

interface EventFeedbackModalProps {
  isOpen: boolean;
  event: EventItem | null;
  onClose: () => void;
  language?: Language;
}

const getRatingLabel = (rating: number, lang: Language) => {
  if (lang === 'vi') {
    switch (rating) {
      case 5: return '⭐⭐⭐⭐⭐ Rất tuyệt vời! Sự kiện xuất sắc';
      case 4: return '⭐⭐⭐⭐ Hài lòng, tổ chức tốt';
      case 3: return '⭐⭐⭐ Bình thường, tạm ổn';
      case 2: return '⭐⭐ Chưa hài lòng, cần cải thiện';
      case 1: return '⭐ Rất không hài lòng';
      default: return 'Chọn mức độ hài lòng của bạn';
    }
  } else {
    switch (rating) {
      case 5: return '⭐⭐⭐⭐⭐ Excellent! Outstanding event';
      case 4: return '⭐⭐⭐⭐ Very Good & well organized';
      case 3: return '⭐⭐⭐ Average / Fair';
      case 2: return '⭐⭐ Unsatisfied, needs improvement';
      case 1: return '⭐ Poor experience';
      default: return 'Select your rating level';
    }
  }
};

export const EventFeedbackModal: React.FC<EventFeedbackModalProps> = ({
  isOpen,
  event,
  onClose,
  language = 'vi',
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const contactError = feedbackContactError(contact, language);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useModalBehavior(isOpen && Boolean(event), () => handleResetAndClose(), isSubmitting);

  if (!isOpen || !event) return null;

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactError || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const result = await publicApi.submitFeedback({
        rating,
        eventId: event.id,
        targetScope: 'entire',
        targetName: language === 'vi' ? event.title : event.titleEn || event.title,
        fullName: fullName.trim() || undefined,
        comments: comment.trim() || undefined,
        contactEmail: contact.trim() || undefined,
        source: 'web_landing',
      });
      recordGuestSubmission('feedback', result?.submissionQuota);
      setIsSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể gửi đánh giá.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="modal-overlay feedback-modal-overlay"
      onClick={handleResetAndClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div
        className="modal-content modal-feedback-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close"
          onClick={handleResetAndClose}
          aria-label={language === 'vi' ? 'Đóng form đánh giá' : 'Close feedback form'}
        >
          <X size={20} />
        </button>

        {isSuccess ? (
          <div className="feedback-success-container">
            <div className="feedback-success-icon-wrap">
              <CheckCircle2 size={44} />
            </div>
            <h3 className="feedback-success-title">
              {language === 'vi' ? 'Cảm ơn đánh giá của bạn!' : 'Thank you for your review!'}
            </h3>
            <p className="feedback-success-desc">
              {language === 'vi'
                ? `Ý kiến đóng góp quý báu của bạn cho sự kiện "${event.title}" đã được ghi nhận. Ban Quản Lý Đường Sách sẽ không ngừng cải thiện chất lượng các hoạt động tiếp theo.`
                : `Your valuable feedback for "${event.titleEn || event.title}" has been recorded. We will continue to improve upcoming events.`}
            </p>
            <button
              type="button"
              className="btn-figma-primary"
              style={{ minWidth: '160px', margin: '0 auto' }}
              onClick={handleResetAndClose}
            >
              {language === 'vi' ? 'Hoàn tất' : 'Done'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="feedback-header">
              <span className="feedback-badge-tag">
                {language === 'vi' ? 'KHẢO SÁT & ĐÁNH GIÁ SỰ KIỆN' : 'EVENT FEEDBACK & REVIEW'}
              </span>
              <h3 id="feedback-modal-title" className="feedback-modal-title">
                {language === 'vi' ? 'Đánh giá sự kiện' : 'Rate & Review Event'}
              </h3>
              <p className="feedback-event-name">
                📖 {language === 'vi' ? event.title : event.titleEn}
              </p>
            </div>

            {/* Star Rating Section */}
            <div className="feedback-rating-box">
              <label className="feedback-section-label">
                {language === 'vi' ? 'Mức độ hài lòng của bạn:' : 'Your overall satisfaction:'}
              </label>
              <div className="feedback-stars-row">
                {[1, 2, 3, 4, 5].map((star) => {
                  const currentDisplay = hoverRating || rating;
                  const isFilled = star <= currentDisplay;
                  return (
                    <button
                      key={star}
                      type="button"
                      className="feedback-star-btn"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      aria-label={`${star} sao`}
                    >
                      <Star
                        size={34}
                        fill={isFilled ? '#F59E0B' : 'transparent'}
                        color={isFilled ? '#D97706' : '#9CA3AF'}
                      />
                    </button>
                  );
                })}
              </div>
              <div className="feedback-rating-text">
                {getRatingLabel(hoverRating || rating, language)}
              </div>
            </div>

            {/* Form Inputs */}
            <div className="feedback-inputs-row">
              <div className="feedback-input-wrap">
                <label className="feedback-input-label">
                  {language === 'vi' ? 'Họ và tên (tùy chọn)' : 'Full Name (optional)'}
                </label>
                <input maxLength={160}
                  type="text"
                  className="feedback-text-input"
                  placeholder={language === 'vi' ? 'Ví dụ: Nguyễn Văn An' : 'e.g. John Doe'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="feedback-input-wrap">
                <label className="feedback-input-label">
                  {language === 'vi' ? 'Email / SĐT (tùy chọn)' : 'Email / Phone (optional)'}
                </label>
                <input maxLength={254}
                  type="text"
                  className="feedback-text-input"
                  placeholder={language === 'vi' ? 'Để nhận quà tri ân...' : 'To receive perks...'}
                  value={contact}
                  aria-invalid={Boolean(contactError)}
                  aria-describedby={contactError ? 'event-feedback-contact-error' : undefined}
                  onChange={(e) => setContact(e.target.value)}
                />
                {contactError && <p id="event-feedback-contact-error" className="feedback-contact-error" role="alert">{contactError}</p>}
              </div>
            </div>

            <div className="feedback-input-wrap">
              <label className="feedback-input-label">
                {language === 'vi' ? 'Ý kiến đóng góp / Cảm nhận chi tiết' : 'Detailed Comments & Suggestions'}
              </label>
              <textarea maxLength={10000}
                className="feedback-textarea"
                rows={3}
                placeholder={language === 'vi' ? 'Chia sẻ cảm nhận chân thật hoặc những điều bạn mong muốn Đường Sách nâng cao trong các sự kiện tới...' : 'Share your honest feedback or suggestions for future events...'}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="feedback-actions">
              {submitError && <p role="alert">{submitError}</p>}
              <button
                type="button"
                className="btn-feedback-cancel"
                onClick={handleResetAndClose}
              >
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || Boolean(contactError)}
                className="btn-figma-primary btn-feedback-submit"
              >
                {isSubmitting ? (
                  <span>{language === 'vi' ? 'Đang gửi...' : 'Submitting...'}</span>
                ) : (
                  <>
                    <Send size={16} />
                    <span>{language === 'vi' ? 'Gửi đánh giá' : 'Submit Review'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
