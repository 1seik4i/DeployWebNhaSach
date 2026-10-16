import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

export interface TimelineItem {
  id?: string;
  date: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  image: string;
  imageAlt: string;
  badge?: React.ReactNode;
  tags?: string[];
}

interface TimelineProps {
  items: TimelineItem[];
}

export default function Timeline({ items }: TimelineProps) {
  const timelineRef = useRef<HTMLOListElement>(null);
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);
  const progress = useMemo(() => {
    const furthestIndex = Math.max(...visibleIndexes, -1);
    return Math.max(0, (furthestIndex + 1) / items.length);
  }, [items.length, visibleIndexes]);

  useEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const nodes = Array.from(timeline.querySelectorAll<HTMLElement>('[data-timeline-index]'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      setVisibleIndexes(nodes.map((_, index) => index));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const index = Number((entry.target as HTMLElement).dataset.timelineIndex);
        if (!entry.isIntersecting) return;
        setVisibleIndexes(current => current.includes(index) ? current : [...current, index]);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px 60px 0px' });

    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [items.length]);

  return (
    <div className="timeline-01-track">
      <span className="timeline-01-rail" aria-hidden="true">
        <span
          className="timeline-01-progress-fill"
          style={{ '--timeline-01-progress': progress } as CSSProperties}
        />
      </span>

      <ol ref={timelineRef} className="timeline-01-list">
        {items.map((item, index) => (
          <li
            key={item.id || `timeline-item-${index}`}
            className={`timeline-01-item ${visibleIndexes.includes(index) ? 'is-visible' : ''}`}
            data-timeline-index={index}
          >
            <div className="timeline-01-marker" aria-hidden="true">
              <span />
            </div>

            <article className="timeline-01-card">
              <div className="timeline-01-media">
                <img src={item.image} alt={item.imageAlt} loading="lazy" />
              </div>
              <div className="timeline-01-content">
                <time className="timeline-01-date">{item.date}</time>
                {item.badge && <p className="timeline-01-badge">{item.badge}</p>}
                <h3>{item.title}</h3>
                <div className="timeline-01-desc">{item.description}</div>
                {item.tags && item.tags.length > 0 && (
                  <ul className="timeline-01-tags" aria-label="Chủ đề liên quan">
                    {item.tags.map(tag => <li key={tag}>{tag}</li>)}
                  </ul>
                )}
              </div>
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
