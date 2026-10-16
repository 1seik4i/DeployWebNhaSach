import { ReactNode, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import './scroll-expansion-hero.css';

interface ScrollExpandMediaProps {
  bgImageSrc: string;
  titleTop: string;
  titleBottom: string;
  scrollToExpand?: string;
  children?: ReactNode;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** A reversible, scroll-driven landing-page opener for the Vite React app. */
export default function ScrollExpandMedia({
  bgImageSrc,
  titleTop,
  titleBottom,
  scrollToExpand = 'Cuộn để mở rộng',
  children,
}: ScrollExpandMediaProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 1440 : window.innerWidth,
    height: typeof window === 'undefined' ? 900 : window.innerHeight,
  }));
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let animationFrame = 0;
    const updateProgress = () => {
      animationFrame = 0;
      const track = trackRef.current;
      if (!track) return;
      if (reduceMotion) {
        setProgress(1);
        return;
      }
      const rect = track.getBoundingClientRect();
      const scrollDistance = Math.max(track.offsetHeight - window.innerHeight, 1);
      setProgress(clamp(-rect.top / scrollDistance));
    };
    const requestUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(updateProgress);
    };
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      requestUpdate();
    };
    updateProgress();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', handleResize);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [reduceMotion]);

  const expansionProgress = clamp(progress / 0.68);
  const initialWidthScale = viewport.width < 768 ? 0.63 : 0.25;
  const initialHeightScale = viewport.width < 768 ? 0.57 : 0.68;
  const pageScale = initialWidthScale + expansionProgress * (1 - initialWidthScale);
  const frameHeightScale = initialHeightScale + expansionProgress * (1 - initialHeightScale);
  const innerZoom = 1.08 - expansionProgress * 0.08;
  const availableHeight = Math.max(viewport.height, 1);
  const pageWidth = viewport.width * pageScale;
  const pageHeight = availableHeight * frameHeightScale;
  const stageCenterY = availableHeight / 2;
  const promptTop = stageCenterY + pageHeight / 2 + 18;
  const offset = expansionProgress * 72;
  const openerOpacity = 1 - clamp((expansionProgress - 0.08) / 0.68);
  const heroReveal = clamp(expansionProgress / 0.32);

  const handleStageClick = () => {
    if (progress < 0.68) {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const scrollDistance = Math.max(track.offsetHeight - window.innerHeight, 1);
      // Target scroll position so that progress reaches >= 0.75 (fully expanded)
      const targetScroll = window.scrollY + rect.top + scrollDistance * 0.72;
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="scroll-expand-hero">
      <div ref={trackRef} className="scroll-expand-track">
      <section
        className={`scroll-expand-stage ${expansionProgress < 0.9 ? 'is-clickable' : ''}`}
        aria-label={`${titleTop} ${titleBottom}`}
        onClick={handleStageClick}
      >
        <motion.img
          className="scroll-expand-background"
          src={bgImageSrc}
          alt=""
          aria-hidden="true"
          style={{ opacity: 1 - expansionProgress * 0.72, scale: 1 + expansionProgress * 0.05 }}
        />
        <div className="scroll-expand-shade" aria-hidden="true" />
        <div
          className="scroll-expand-media"
          style={{ width: `${pageWidth}px`, height: `${pageHeight}px`, borderRadius: `${18 * (1 - expansionProgress)}px` }}
        >
          <div
            className="scroll-expand-inner-page"
            style={{
              height: `${availableHeight}px`,
              transform: `translate(-50%, -50%) scale(${innerZoom})`,
              opacity: 0.38 + heroReveal * 0.62,
              filter: `blur(${(1 - heroReveal) * 3.5}px) brightness(${0.62 + heroReveal * 0.38})`,
              pointerEvents: expansionProgress > 0.98 ? 'auto' : 'none',
            }}
          >
            {children}
          </div>
        </div>
        <div className="scroll-expand-title" aria-hidden="true" style={{ opacity: openerOpacity, top: `${stageCenterY}px` }}>
          <h1 style={{ transform: `translateX(-${offset}vw)` }}>{titleTop}</h1>
          <h1 style={{ transform: `translateX(${offset}vw)` }}>{titleBottom}</h1>
        </div>
        <p className="scroll-expand-prompt-outside" style={{ opacity: openerOpacity, top: `${promptTop}px` }}>{scrollToExpand}</p>
      </section>
      </div>
    </div>
  );
}
