import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowDown,
  ChevronRight,
  Compass,
  GraduationCap,
  Briefcase,
  Award,
  Globe,
  Sparkles
} from 'lucide-react';
import { Language } from '../types';
import TimelineBlock01, { type TimelineItem } from '../components/ui/timeline-01';
import VisionMissionBento from '../components/ui/VisionMissionBento';
import { landingContentService, PartnerItem } from '../services/landingContentService';
import './JourneyExperience.css';

interface JourneyExperienceProps {
  language: Language;
  open: boolean;
}

interface AchievementCounterProps {
  value: number;
  suffix: string;
  language: Language;
}

const AchievementCounter: React.FC<AchievementCounterProps> = ({ value, suffix, language }) => {
  const counterRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);
  const [displayValue, setDisplayValue] = useState(0);
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';

  useEffect(() => {
    const counter = counterRef.current;
    if (!counter || hasStartedRef.current) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startCounter = () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      if (reducedMotion) {
        setDisplayValue(value);
        return;
      }

      const duration = value >= 1000 ? 1400 : 1100;
      let startTime: number | null = null;
      const tick = (timestamp: number) => {
        startTime ??= timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(Math.round(value * easedProgress));

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(tick);
        }
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        startCounter();
        observer.disconnect();
      }
    }, { threshold: 0.45 });

    observer.observe(counter);
    return () => {
      observer.disconnect();
      if (animationFrameRef.current) window.cancelAnimationFrame(animationFrameRef.current);
    };
  }, [value]);

  const formattedValue = new Intl.NumberFormat(locale).format(displayValue);
  const fullValue = `${new Intl.NumberFormat(locale).format(value)}${suffix}`;

  return (
    <div
      ref={counterRef}
      className="journey-achieve-num journey-achievement-counter"
      data-achievement-counter
      data-counter-target={value}
      aria-label={fullValue}
    >
      <span aria-hidden="true">{formattedValue}</span>
      <span aria-hidden="true">{suffix}</span>
    </div>
  );
};

const JOURNEY_CHAPTERS = [
  { id: 'brand-story', index: '1', vi: 'Giới thiệu chung', en: 'Introduction' },
  { id: 'tam-nhin-su-menh', index: '2', vi: 'Tầm nhìn & Sứ mệnh', en: 'Vision & Mission' },
  { id: 'history', index: '3', vi: 'Lịch sử phát triển', en: 'History & Growth' },
  { id: 'thanh-tuu', index: '4', vi: 'Thành tích', en: 'Achievements' },
  { id: 'doi-tac', index: '5', vi: 'Đối tác & Hợp tác', en: 'Partners' },
] as const;

export const JourneyExperience: React.FC<JourneyExperienceProps> = ({ language, open }) => {
  const vi = language === 'vi';
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const topbarHandoffScrollRef = useRef<number | null>(null);
  const [activeChapter, setActiveChapter] = useState('brand-story');
  const [isRailSticky, setIsRailSticky] = useState(false);

  const [journeyData, setJourneyData] = useState(() => landingContentService.getJourney());

  useEffect(() => {
    const handleUpdate = () => {
      setJourneyData(landingContentService.getJourney());
    };
    handleUpdate();
    void landingContentService.refreshPublic().then(handleUpdate);
    window.addEventListener('duongsach_landing_content_changed', handleUpdate);
    return () => window.removeEventListener('duongsach_landing_content_changed', handleUpdate);
  }, []);

  const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Lock body scroll when the sliding experience sheet is open
  useLayoutEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('journey-experience-open');
    return () => {
      document.body.style.overflow = oldOverflow;
      document.body.classList.remove('journey-experience-open');
    };
  }, [open]);

  // Scroll to anchor on hash change or initial open
  useLayoutEffect(() => {
    if (!open) return;
    const hash = location.hash;
    const oldTitle = document.title;
    document.title = vi
      ? 'Hành trình phát triển Đường Sách TP.HCM — 10 Năm Không Gian Tri Thức'
      : 'Development Journey — HCMC Book Street';

    if (hash) {
      const targetId = hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el && panelRef.current) {
          el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
        }
      }, 100);
      return () => {
        clearTimeout(timer);
        document.title = oldTitle;
      };
    } else {
      if (panelRef.current) {
        panelRef.current.scrollTop = 0;
      }
    }

    return () => {
      document.title = oldTitle;
    };
  }, [open, vi, location.hash]);

  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;

    const root = panelRef.current;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-journey-reveal]'));

    if (prefersReducedMotion()) {
      root.classList.remove('journey-motion-ready');
      targets.forEach(target => target.classList.add('is-visible'));
      return;
    }

    root.classList.add('journey-motion-ready');

    let frameId = 0;
    const revealVisibleTargets = () => {
      frameId = 0;
      const rootRect = root.getBoundingClientRect();
      const revealBoundary = rootRect.top + rootRect.height * 0.92;
      const upperBoundary = rootRect.top + rootRect.height * 0.04;

      targets.forEach(target => {
        if (target.classList.contains('is-visible')) return;
        const rect = target.getBoundingClientRect();
        if (rect.top <= revealBoundary && rect.bottom >= upperBoundary) {
          target.classList.add('is-visible');
        }
      });

      if (targets.every(target => target.classList.contains('is-visible'))) {
        root.removeEventListener('scroll', scheduleReveal);
      }
    };

    const scheduleReveal = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(revealVisibleTargets);
    };

    root.addEventListener('scroll', scheduleReveal, { passive: true });
    scheduleReveal();
    return () => {
      root.removeEventListener('scroll', scheduleReveal);
      if (frameId) window.cancelAnimationFrame(frameId);
      root.classList.remove('journey-motion-ready');
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !panelRef.current) return;

    const root = panelRef.current;
    let frameId = 0;

    const updateScrollMotion = () => {
      frameId = 0;
      const maxScroll = Math.max(root.scrollHeight - root.clientHeight, 1);
      const readProgress = Math.min(Math.max(root.scrollTop / maxScroll, 0), 1);
      const hero = root.querySelector<HTMLElement>('.fptu-style-hero');
      const heroHeight = hero?.offsetHeight ?? 480;
      const heroProgress = Math.min(Math.max(root.scrollTop / Math.max(heroHeight, 1), 0), 1);
      const reduceMotion = prefersReducedMotion();

      const topbar = root.querySelector<HTMLElement>('.journey-topbar');
      const rail = root.querySelector<HTMLElement>('.journey-chapter-rail');

      let meetsTopbar = false;
      if (rail && topbar) {
        if (topbarHandoffScrollRef.current === null) {
          topbarHandoffScrollRef.current = Math.max(rail.offsetTop - topbar.offsetHeight, 0);
        }
        meetsTopbar = root.scrollTop >= topbarHandoffScrollRef.current;
      } else {
        meetsTopbar = root.scrollTop >= (heroHeight - 56);
      }
      setIsRailSticky(meetsTopbar);

      root.style.setProperty('--journey-read-progress', readProgress.toFixed(4));
      root.style.setProperty('--journey-hero-image-y', reduceMotion ? '0px' : `${(heroProgress * 30).toFixed(2)}px`);
      root.style.setProperty('--journey-hero-copy-y', reduceMotion ? '0px' : `${(heroProgress * 16).toFixed(2)}px`);
      root.style.setProperty('--journey-hero-copy-opacity', reduceMotion ? '1' : `${(1 - heroProgress * 0.48).toFixed(3)}`);
    };

    const scheduleScrollMotion = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateScrollMotion);
    };

    root.addEventListener('scroll', scheduleScrollMotion, { passive: true });
    window.addEventListener('resize', scheduleScrollMotion);
    scheduleScrollMotion();

    return () => {
      root.removeEventListener('scroll', scheduleScrollMotion);
      window.removeEventListener('resize', scheduleScrollMotion);
      if (frameId) window.cancelAnimationFrame(frameId);
      root.style.removeProperty('--journey-read-progress');
      root.style.removeProperty('--journey-hero-image-y');
      root.style.removeProperty('--journey-hero-copy-y');
      root.style.removeProperty('--journey-hero-copy-opacity');
      topbarHandoffScrollRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !panelRef.current) return;

    const root = panelRef.current;
    const chapters = Array.from(root.querySelectorAll<HTMLElement>('[data-journey-chapter]'));
    let frameId = 0;

    const updateActiveChapter = () => {
      frameId = 0;
      const railHeight = root.querySelector<HTMLElement>('.journey-chapter-rail')?.offsetHeight ?? 52;
      const readingLine = root.getBoundingClientRect().top + railHeight + 24;
      let nextActiveChapter = chapters[0]?.id ?? 'brand-story';
      const isAtDocumentEnd = root.scrollTop + root.clientHeight >= root.scrollHeight - 2;

      if (isAtDocumentEnd) {
        nextActiveChapter = chapters.at(-1)?.id ?? nextActiveChapter;
      } else {
        for (const chapter of chapters) {
          if (chapter.getBoundingClientRect().top <= readingLine) {
            nextActiveChapter = chapter.id;
          } else {
            break;
          }
        }
      }

      setActiveChapter(current => current === nextActiveChapter ? current : nextActiveChapter);
    };

    const scheduleActiveChapterUpdate = () => {
      if (!frameId) frameId = window.requestAnimationFrame(updateActiveChapter);
    };

    root.addEventListener('scroll', scheduleActiveChapterUpdate, { passive: true });
    window.addEventListener('resize', scheduleActiveChapterUpdate);
    scheduleActiveChapterUpdate();

    return () => {
      root.removeEventListener('scroll', scheduleActiveChapterUpdate);
      window.removeEventListener('resize', scheduleActiveChapterUpdate);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [open]);

  const closeSheet = () => {
    navigate('/');
  };

  const scrollToAnchor = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      setActiveChapter(elementId);
      window.history.replaceState(null, '', `#${elementId}`);
      el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
  };

  const handleGalleryPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType === 'touch'
      || prefersReducedMotion()
      || !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) return;

    const target = event.currentTarget;
    const bounds = target.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    target.style.setProperty('--gallery-x', `${(x * 5).toFixed(2)}px`);
    target.style.setProperty('--gallery-y', `${(y * 4).toFixed(2)}px`);
    target.style.setProperty('--gallery-rx', `${(-y * 1.4).toFixed(2)}deg`);
    target.style.setProperty('--gallery-ry', `${(x * 1.6).toFixed(2)}deg`);
    target.style.setProperty('--gallery-x-alt', `${(-x * 3).toFixed(2)}px`);
    target.style.setProperty('--gallery-y-alt', `${(-y * 2.5).toFixed(2)}px`);
    target.style.setProperty('--gallery-rx-alt', `${(y * 0.8).toFixed(2)}deg`);
    target.style.setProperty('--gallery-ry-alt', `${(-x * 0.9).toFixed(2)}deg`);
  };

  const resetGalleryPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    target.style.setProperty('--gallery-x', '0px');
    target.style.setProperty('--gallery-y', '0px');
    target.style.setProperty('--gallery-rx', '0deg');
    target.style.setProperty('--gallery-ry', '0deg');
    target.style.setProperty('--gallery-x-alt', '0px');
    target.style.setProperty('--gallery-y-alt', '0px');
    target.style.setProperty('--gallery-rx-alt', '0deg');
    target.style.setProperty('--gallery-ry-alt', '0deg');
  };

  // Dữ liệu dòng thời gian các mốc son
  const timelineMilestones = useMemo(() => {
    if (journeyData.milestones && journeyData.milestones.length > 0) {
      return journeyData.milestones.map(m => ({
        year: m.year,
        badge: m.badge,
        title: m.title,
        desc: m.desc,
        tags: [m.badge],
        image: m.image,
        imageAlt: m.title
      }));
    }
    return [];
  }, [journeyData.milestones]);

  // Educational & Enterprise Partners (Dynamic from service)
  const educationPartners = journeyData.educationPartners || [];
  const enterprisePartners = journeyData.enterprisePartners || [];

  const renderPartnerLogo = (partner: PartnerItem) => {
    if (partner.logoUrl) {
      return (
        <img
          src={partner.logoUrl}
          alt={partner.name}
          style={{ maxHeight: '38px', maxWidth: '140px', objectFit: 'contain' }}
        />
      );
    }
    const lower = (partner.name || '').toLowerCase();
    const id = (partner.id || '').toLowerCase();

    if (id.includes('deakin') || lower.includes('deakin')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="46" stroke="#111827" strokeWidth="6" />
            <path d="M36 30h16c14 0 22 8 22 20s-8 20-22 20H36V30zm10 32h6c8 0 12-4 12-12s-4-12-12-12h-6v24z" fill="#111827" />
          </svg>
          <div style={{ lineHeight: 1.1, textAlign: 'left' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', display: 'block' }}>DEAKIN</span>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#4B5563', letterSpacing: '0.04em' }}>UNIVERSITY</span>
          </div>
        </div>
      );
    }
    if (id.includes('ntu') || lower.includes('nanyang')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="30" height="34" viewBox="0 0 60 70" fill="none">
            <path d="M30 2L5 14v26c0 18 25 28 25 28s25-10 25-28V14L30 2z" fill="#D92D20" />
            <path d="M30 6L9 16v22c0 14 21 24 21 24s21-10 21-24V16L30 6z" fill="#1E3A8A" />
            <path d="M30 18l4 8h9l-7 6 3 9-9-6-9 6 3-9-7-6h9z" fill="#FDB022" />
          </svg>
          <div style={{ lineHeight: 1.05, textAlign: 'left' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#1E3A8A', letterSpacing: '-0.01em', display: 'block' }}>NANYANG</span>
            <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#D92D20', letterSpacing: '0.02em', display: 'block' }}>TECHNOLOGICAL UNIVERSITY</span>
            <span style={{ fontSize: '0.52rem', fontWeight: 600, color: '#4B5563' }}>SINGAPORE</span>
          </div>
        </div>
      );
    }
    if (id.includes('nus') || lower.includes('nus') || lower.includes('singapore')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="32" height="36" viewBox="0 0 70 80" fill="none">
            <path d="M5 8h60v40c0 18-20 28-30 30-10-2-30-12-30-30V8z" fill="#003D7C" />
            <path d="M35 18c-8 0-14 6-14 14 0 6 4 11 10 13l-4 15h16l-4-15c6-2 10-7 10-13 0-8-6-14-14-14z" fill="#EF7C00" />
          </svg>
          <div style={{ lineHeight: 1.1, textAlign: 'left' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#003D7C', letterSpacing: '0.04em', display: 'block' }}>NUS</span>
            <span style={{ fontSize: '0.52rem', fontWeight: 600, color: '#4B5563', lineHeight: 1 }}>National University<br/>of Singapore</span>
          </div>
        </div>
      );
    }
    if (id.includes('swinburne') || lower.includes('swinburne')) {
      return (
        <div style={{ display: 'flex', alignItems: 'stretch', borderRadius: '4px', overflow: 'hidden', border: '1px solid #111827' }}>
          <div style={{ background: '#111827', color: '#fff', padding: '4px 6px', fontSize: '0.72rem', fontWeight: 900, lineHeight: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span>SWIN</span>
            <span>BUR</span>
            <span style={{ color: '#E11D48' }}>*NE*</span>
          </div>
          <div style={{ background: '#DC2626', color: '#fff', padding: '4px 6px', fontSize: '0.52rem', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1.1, display: 'flex', alignItems: 'center', maxWidth: '82px' }}>
            SWINBURNE UNIVERSITY OF TECHNOLOGY
          </div>
        </div>
      );
    }
    if (id.includes('epita') || lower.includes('epita')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="40" height="30" viewBox="0 0 120 80" fill="none">
            <polygon points="10,40 50,10 70,25 40,40 70,55 50,70" fill="#0090D0" />
            <polygon points="50,10 110,40 50,70 70,55 90,40 70,25" fill="#005B94" />
          </svg>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#005B94', letterSpacing: '0.06em', display: 'block', lineHeight: 1 }}>EPITA</span>
            <span style={{ fontSize: '0.48rem', fontWeight: 600, color: '#64748B' }}>GRADUATE SCHOOL OF ENGINEERING</span>
          </div>
        </div>
      );
    }
    if (id.includes('kedge') || lower.includes('kedge')) {
      return (
        <div style={{ textAlign: 'left' }}>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', display: 'block', lineHeight: 0.95 }}>KEDGE</span>
          <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#6B7280', letterSpacing: '0.14em', borderTop: '1.5px solid #E11D48', paddingTop: '2px', display: 'inline-block' }}>BUSINESS SCHOOL</span>
        </div>
      );
    }
    if (id.includes('fpt') || lower.includes('fpt')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.03em' }}>
            <span style={{ color: '#0284C7' }}>F</span>
            <span style={{ color: '#EA580C' }}>P</span>
            <span style={{ color: '#16A34A' }}>T</span>
          </div>
          {partner.subText && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1F2937' }}>{partner.subText}</span>}
        </div>
      );
    }
    if (id.includes('vinai') || lower.includes('vinai')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ background: '#1E3A8A', color: '#fff', fontWeight: 900, fontSize: '0.9rem', padding: '3px 8px', borderRadius: '4px' }}>VinAI</div>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1E3A8A', letterSpacing: '0.05em' }}>RESEARCH</span>
        </div>
      );
    }
    if (id.includes('vingroup') || lower.includes('vingroup')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FACC15">
              <path d="M12 2L15 9H22L16.5 13.5L18.5 20.5L12 16L5.5 20.5L7.5 13.5L2 9H9L12 2Z" />
            </svg>
          </div>
          <span style={{ fontSize: '0.86rem', fontWeight: 900, color: '#DC2626', letterSpacing: '0.04em' }}>VINGROUP</span>
        </div>
      );
    }
    if (id.includes('topcv') || lower.includes('topcv')) {
      return (
        <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#00B14F', letterSpacing: '-0.02em' }}>top</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>cv</span>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00B14F', display: 'inline-block', marginLeft: '1px' }} />
          </div>
          <span style={{ fontSize: '0.45rem', fontWeight: 600, color: '#6B7280' }}>Tiếp lợi thế, nối thành công</span>
        </div>
      );
    }
    if (id.includes('vinfast') || lower.includes('vinfast')) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="24" height="22" viewBox="0 0 60 50" fill="none">
            <path d="M30 46L2 6h14l14 26L44 6h14L30 46z" fill="#94A3B8" />
            <path d="M30 38L12 8h8l10 18L40 8h8L30 38z" fill="#475569" />
          </svg>
          <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#334155', letterSpacing: '0.12em' }}>VINFAST</span>
        </div>
      );
    }
    if (id.includes('siemens') || lower.includes('siemens')) {
      return (
        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#00646E', letterSpacing: '0.08em', fontFamily: 'sans-serif' }}>SIEMENS</span>
      );
    }
    if (id.includes('samsung') || lower.includes('samsung')) {
      return (
        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1428A0', letterSpacing: '0.12em', fontFamily: 'sans-serif' }}>SAMSUNG</span>
      );
    }

    // Default Stylized Text Card
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2px 8px', textAlign: 'center' }}>
        <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#14241F', letterSpacing: '0.02em', lineHeight: 1.2 }}>
          {partner.logoText || partner.name}
        </span>
        {partner.subText && (
          <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#6B7280', marginTop: '2px' }}>
            {partner.subText}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      className={`journey-sheet ${open ? 'is-open' : ''}`}
      aria-hidden={!open}
    >
      <div className="journey-document">
        {/* Sticky Topbar */}
        <div className={`journey-topbar ${isRailSticky ? 'is-collapsed' : ''}`}>
          <div className="journey-container journey-topbar-content">
            <button
              type="button"
              className={`journey-back-btn ${isRailSticky ? 'is-transferred' : ''}`}
              onClick={closeSheet}
              title={vi ? 'Quay lại Trang chủ' : 'Back to Home'}
            >
              <ArrowLeft size={16} />
              <span>{vi ? 'Quay lại Trang chủ' : 'Back to Home'}</span>
            </button>

            <div className="journey-breadcrumbs">
              <span>{vi ? 'Trang chủ' : 'Home'}</span>
              <ChevronRight size={13} />
              <span className="active">{vi ? 'Hành trình phát triển' : 'Development Journey'}</span>
            </div>
          </div>
        </div>

        {/* 1. Hero Banner matching FPTU style with Left White Gradient Fade & Right Photo */}
        <section className="journey-hero fptu-style-hero">
          <div
            className="fptu-hero-bg-photo"
            style={{ backgroundImage: journeyData.hero?.bgPhoto ? `url(${journeyData.hero.bgPhoto})` : 'none' }}
            aria-hidden="true"
          />
          <div className="fptu-hero-gradient-overlay" aria-hidden="true" />
          <div className="journey-container fptu-hero-container">
            <div className="fptu-hero-brand-lockup">
              <div className="journey-hero-era" aria-label={journeyData.hero?.era || ''}>
                <span aria-hidden="true" />
                <strong>{journeyData.hero?.era?.split('—')[0]?.trim() || ''}</strong>
                <i aria-hidden="true">—</i>
                <strong>{journeyData.hero?.era?.split('—')[1]?.trim() || ''}</strong>
              </div>
              <h1 className="fptu-hero-main-title">
                <span className="fptu-hero-line-1">{journeyData.hero?.titleLine1}</span>
                <span className="fptu-hero-line-2">{journeyData.hero?.titleLine2}</span>
                <span className="fptu-hero-line-3">{journeyData.hero?.titleLine3}</span>
              </h1>
              <p className="journey-hero-summary">
                {journeyData.hero?.summary || ''}
              </p>
            </div>
          </div>
        </section>

        <nav
          className={`journey-chapter-rail ${isRailSticky ? 'is-sticky' : ''}`}
          aria-label={vi ? 'Các chương hành trình' : 'Journey chapters'}
        >
          <div className="journey-container journey-chapter-rail-inner">
            {/* Integrated Back Button when rail sticks to top */}
            <button
              type="button"
              className={`journey-rail-back-btn ${isRailSticky ? 'is-visible' : ''}`}
              onClick={closeSheet}
              title={vi ? 'Quay lại Trang chủ' : 'Back to Home'}
              aria-label={vi ? 'Quay lại Trang chủ' : 'Back to Home'}
            >
              <ArrowLeft size={16} />
              <span className="rail-back-text">{vi ? 'Quay lại' : 'Back'}</span>
            </button>

            <div className="journey-rail-links-group">
              {JOURNEY_CHAPTERS.map(chapter => (
                <a
                  key={chapter.id}
                  href={`#${chapter.id}`}
                  className={`journey-chapter-link ${activeChapter === chapter.id ? 'is-active' : ''}`}
                  aria-current={activeChapter === chapter.id ? 'location' : undefined}
                  onClick={event => {
                    event.preventDefault();
                    scrollToAnchor(chapter.id);
                  }}
                >
                  <span className="journey-chapter-link-index">{chapter.index}</span>
                  <span>{vi ? chapter.vi : chapter.en}</span>
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* 2. CÂU CHUYỆN VỀ ĐƯỜNG SÁCH (Brand Story Gallery Mosaic) */}
        <section id="brand-story" className="journey-section journey-chapter journey-chapter--paper journey-brand-story-section" data-journey-chapter>
          <div className="journey-container">
            <div className="journey-section-header" data-journey-reveal="up">
              <h2 className="journey-section-title">
                <span>{journeyData.brandStory?.title || ''}</span>
              </h2>
              <p className="journey-section-desc">
                {journeyData.brandStory?.desc || ''}
              </p>
            </div>

            <div className="journey-story-grid">
              <div className="journey-story-left" data-journey-reveal="left">
                <h3 className="journey-story-heading">
                  {journeyData.brandStory?.heading}
                </h3>
                <p className="journey-story-paragraph">
                  {journeyData.brandStory?.paragraph1 || ''}
                </p>
                <p className="journey-story-paragraph">
                  {journeyData.brandStory?.paragraph2 || ''}
                </p>
                <div className="journey-story-quote">
                  <p>
                    {journeyData.brandStory?.quote || ''}
                  </p>
                  <span>— {journeyData.brandStory?.quoteAuthor}</span>
                </div>
              </div>

              {/* Story Gallery Mosaic */}
              <div
                className="journey-gallery-mosaic"
                data-journey-reveal="right"
                onPointerMove={handleGalleryPointerMove}
                onPointerLeave={resetGalleryPointer}
              >
                <div className="gallery-mosaic-col">
                  <div className="gallery-mosaic-item large">
                    {journeyData.brandStory?.image1 && <img src={journeyData.brandStory.image1} alt={journeyData.brandStory.image1Caption || ''} />}
                    <div className="gallery-item-caption">
                      <span>{journeyData.brandStory?.image1Caption}</span>
                    </div>
                  </div>
                  <div className="gallery-mosaic-subrow">
                    <div className="gallery-mosaic-item">
                      {journeyData.brandStory?.image2 && <img src={journeyData.brandStory.image2} alt={journeyData.brandStory.image2Caption || ''} />}
                      <div className="gallery-item-caption">
                        <span>{journeyData.brandStory?.image2Caption}</span>
                      </div>
                    </div>
                    <div className="gallery-mosaic-item">
                      {journeyData.brandStory?.image3 && <img src={journeyData.brandStory.image3} alt={journeyData.brandStory.image3Caption || ''} />}
                      <div className="gallery-item-caption">
                        <span>{journeyData.brandStory?.image3Caption}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="gallery-mosaic-col single">
                  <div className="gallery-mosaic-item tall">
                    {journeyData.brandStory?.image4 && <img src={journeyData.brandStory.image4} alt={journeyData.brandStory.image4Caption || ''} />}
                    <div className="gallery-item-caption">
                      <span>{journeyData.brandStory?.image4Caption}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. TẦM NHÌN & SỨ MỆNH (Vision & Mission) */}
        <section id="tam-nhin-su-menh" className="journey-section journey-chapter journey-chapter--paper journey-vision-section" data-journey-chapter>
          <div className="journey-container">
            <VisionMissionBento language={language} data={journeyData.visionMission} />
          </div>
        </section>

        {/* 3. LỊCH SỬ HÌNH THÀNH */}
        <section id="history" className="journey-section journey-chapter journey-chapter--sage" data-journey-chapter>
          <div className="journey-container">
            <TimelineBlock01
              title={journeyData.milestonesHeader?.title || ''}
              description={journeyData.milestonesHeader?.desc || ''}
              items={timelineMilestones.map((item: any, idx: number) => ({
                id: item.id || `ms-${idx}`,
                date: item.year,
                title: item.title,
                description: item.desc,
                image: item.image,
                imageAlt: item.imageAlt,
                badge: item.badge,
                tags: item.tags,
              }) satisfies TimelineItem)}
            />
          </div>
        </section>

        {/* 4. THÀNH TỰU & CON SỐ NỔI BẬT (Achievements & Impact) */}
        <section id="thanh-tuu" className="journey-section journey-chapter journey-chapter--dark" data-journey-chapter>
          <div className="journey-container">
            <div className="journey-section-header" data-journey-reveal="up">
              <h2 className="journey-section-title">{journeyData.achievementsHeader?.title}</h2>
              <p className="journey-section-desc">
                {journeyData.achievementsHeader?.desc}
              </p>
            </div>

            {/* Achievement Cards with numbers */}
            <div className="journey-achieve-grid">
              {(journeyData.achievements || []).map((ach, idx) => (
                <div key={idx} className="journey-achieve-card" data-journey-reveal="up" style={{ '--reveal-order': idx } as CSSProperties}>
                  <AchievementCounter value={ach.value} suffix={ach.suffix} language={language} />
                  <div className="journey-achieve-label">{ach.label}</div>
                  <p className="journey-achieve-desc">{ach.desc}</p>
                </div>
              ))}
            </div>

            {/* Vinh danh Giải thưởng Quốc tế UIA 2030 Award */}
            <div className="journey-award-spotlight" data-journey-reveal="up">
              <div className="journey-award-badge-glow">
                <div className="journey-award-icon-box">
                  <Award size={34} className="journey-award-icon" />
                </div>
              </div>
              <div className="journey-award-content">
                <div className="journey-award-meta">
                  <span className="journey-award-tag">
                    <Sparkles size={13} />
                    {vi ? 'Giải thưởng Quốc tế 2026' : 'International Award 2026'}
                  </span>
                  <span className="journey-award-org">
                    <Globe size={13} />
                    {vi ? 'UIA (Liên hiệp Kiến trúc sư Thế giới) & UN-Habitat' : 'UIA & UN-Habitat'}
                  </span>
                </div>
                <h3 className="journey-award-title">
                  {vi
                    ? 'Giải thưởng Vinh danh Quốc tế UIA 2030 Award'
                    : 'UIA 2030 International Honorary Award'}
                </h3>
                <p className="journey-award-category">
                  {vi
                    ? 'Hạng mục: Tiếp cận không gian xanh & công cộng (Access to green and public spaces)'
                    : 'Category: Access to green and public spaces'}
                </p>
                <p className="journey-award-desc">
                  {vi
                    ? 'Đường Sách TP.HCM vinh dự được xướng tên tại Diễn đàn Đô thị Thế giới (WUF) trong khuôn khổ giải thưởng UIA 2030 Award, ghi nhận mô hình kiểu mẫu trong việc tích hợp không gian xanh mở, chấn hưng văn hóa đọc và lan tỏa giá trị nhân văn gắn kết cộng đồng bền vững giữa trung tâm đô thị.'
                    : 'HCMC Book Street was proudly honored at the World Urban Forum under the UIA 2030 Award, recognizing an exemplary urban model integrating vibrant green public space, fostering reading culture, and nurturing humanistic community bonds.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. ĐỐI TÁC VÀ HỢP TÁC QUỐC TẾ */}
        <section id="doi-tac" className="journey-section journey-chapter journey-chapter--paper journey-partners-section" data-journey-chapter>
          <div className="journey-partners-bg-circuit" aria-hidden="true" />
          
          <div className="journey-container">
            <div className="journey-partners-header-wrap" data-journey-reveal="up">
              <div>
                <h2 className="journey-partners-main-title">
                  {journeyData.partnersHeader?.title ? (
                    <span>{journeyData.partnersHeader.title}</span>
                  ) : vi ? (
                    <>
                      Đối tác và <span className="journey-partners-highlight">hợp tác quốc tế</span>
                    </>
                  ) : (
                    <>
                      Partners & <span className="journey-partners-highlight">International Cooperation</span>
                    </>
                  )}
                </h2>
              </div>
            </div>

            {/* Category 1: Educational Partners */}
            <div className="journey-partners-category" data-journey-reveal="up">
              <div className="journey-partners-cat-header">
                <h3 className="journey-partners-cat-title">
                  <GraduationCap size={18} color="#EA580C" />
                  <span>{journeyData.partnersHeader?.eduTitle}</span>
                </h3>
                <div className="journey-partners-cat-line" />
              </div>

              <div className="journey-partners-marquee-container">
                <div className="journey-partners-marquee-track">
                  {[...educationPartners, ...educationPartners].map((partner, pIdx) => (
                    <div key={`${partner.id}-${pIdx}`} className="journey-partner-card" title={partner.name}>
                      <div className="journey-partner-logo-wrap">
                        {renderPartnerLogo(partner)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category 2: Enterprise Partners */}
            <div className="journey-partners-category" data-journey-reveal="up">
              <div className="journey-partners-cat-header">
                <h3 className="journey-partners-cat-title">
                  <Briefcase size={18} color="#0284C7" />
                  <span>{journeyData.partnersHeader?.corpTitle}</span>
                </h3>
                <div className="journey-partners-cat-line" />
              </div>

              <div className="journey-partners-marquee-container">
                <div className="journey-partners-marquee-track track-reverse">
                  {[...enterprisePartners, ...enterprisePartners].map((partner, pIdx) => (
                    <div key={`${partner.id}-${pIdx}`} className="journey-partner-card" title={partner.name}>
                      <div className="journey-partner-logo-wrap">
                        {renderPartnerLogo(partner)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
