import React from 'react';
import './SkeletonCard.css';

/**
 * Skeleton loading card for BoothsSection (Gian hàng)
 * Mirrors the exact structure of .figma-kiosk-card
 */
export const BoothCardSkeleton: React.FC = () => {
  return (
    <div className="figma-kiosk-card skeleton-kiosk-card" aria-hidden="true">
      <div className="kiosk-card-photo-wrapper skeleton-box skeleton-photo">
        <div className="kiosk-banner-tags">
          <span className="kiosk-cat-label skeleton-badge-placeholder"></span>
        </div>
      </div>

      <div className="kiosk-card-body">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-desc"></div>
        <div className="skeleton-line skeleton-desc short"></div>

        <div className="kiosk-highlights">
          <div className="skeleton-line skeleton-tag-label"></div>
          <div className="kiosk-books-row">
            <span className="kiosk-book-tag skeleton-tag-item"></span>
            <span className="kiosk-book-tag skeleton-tag-item"></span>
          </div>
        </div>

        <div className="kiosk-card-footer">
          <div className="skeleton-btn skeleton-btn-primary"></div>
          <div className="skeleton-btn skeleton-btn-secondary"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loading view for EventCoverflow (Sự kiện)
 * Mirrors the exact structure of Event Coverflow 3D stage and detail preview
 */
export const EventCoverflowSkeleton: React.FC = () => {
  return (
    <div className="event-coverflow skeleton-event-coverflow" aria-hidden="true">
      <div className="event-coverflow-stage-wrap">
        <div className="event-coverflow-arrow skeleton-arrow"></div>
        <div className="event-coverflow-stage skeleton-stage">
          {/* Left slide */}
          <div className="event-coverflow-slide skeleton-slide is-side-left">
            <div className="skeleton-box skeleton-slide-img"></div>
          </div>
          {/* Active Center slide */}
          <div className="event-coverflow-slide skeleton-slide is-selected">
            <div className="skeleton-box skeleton-slide-img"></div>
            <span className="event-coverflow-week-badge skeleton-badge-placeholder"></span>
          </div>
          {/* Right slide */}
          <div className="event-coverflow-slide skeleton-slide is-side-right">
            <div className="skeleton-box skeleton-slide-img"></div>
          </div>
        </div>
        <div className="event-coverflow-arrow skeleton-arrow"></div>
      </div>

      <div className="event-coverflow-details">
        <div className="event-coverflow-details-main">
          <div className="skeleton-line skeleton-kicker"></div>
          <div className="skeleton-line skeleton-event-title"></div>
          <div className="skeleton-line skeleton-event-desc"></div>
          <div className="skeleton-line skeleton-event-desc short"></div>
          <div className="event-coverflow-meta">
            <span className="skeleton-meta-pill"></span>
            <span className="skeleton-meta-pill"></span>
            <span className="skeleton-meta-pill"></span>
          </div>
        </div>
        <div className="event-coverflow-actions">
          <div className="skeleton-btn skeleton-btn-event-detail"></div>
          <div className="skeleton-btn skeleton-btn-event-reg"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loading item for DigitalLibrarySection (Thư viện số)
 * Mirrors .library-ranking-item and .book-cover-stage
 */
export const LibraryBookSkeleton: React.FC<{ index?: number }> = ({ index = 1 }) => {
  return (
    <div className="library-ranking-item skeleton-ranking-item" aria-hidden="true">
      <span className="library-ranking-visual">
        <span className={`library-ranking-number skeleton-number ${index >= 10 ? 'is-double-digit' : ''}`}>
          {index}
        </span>
        <div className="book-cover-stage skeleton-book-cover skeleton-box">
          <div className="skeleton-book-spine"></div>
        </div>
        <span className="library-ranking-badge skeleton-rank-badge"></span>
      </span>
    </div>
  );
};
