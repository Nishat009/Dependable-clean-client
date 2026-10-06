import React, { useEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Watches every [data-reveal] element (including ones rendered later) and adds .is-visible once it scrolls into view.
export function useRevealObserver(path: string): void {
  useEffect(() => {
    document.documentElement.classList.add('motion-ready');
    const reveal = (element: Element) => element.classList.add('is-visible');
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-reveal]').forEach(reveal);
      return undefined;
    }
    const intersection = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        intersection.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    const watch = (scope: ParentNode) => scope.querySelectorAll('[data-reveal]:not(.is-visible)').forEach((element) => intersection.observe(element));
    watch(document);
    const mutation = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;
      if (node.matches('[data-reveal]:not(.is-visible)')) intersection.observe(node);
      watch(node);
    })));
    mutation.observe(document.body, { childList: true, subtree: true });
    return () => { intersection.disconnect(); mutation.disconnect(); };
  }, [path]);
}

interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

// Counts from 0 to `value` the first time it becomes visible, then moves straight to new values.
export function CountUp({ value, prefix = '', suffix = '', duration = 1400 }: CountUpProps) {
  const target = Number(value) || 0;
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) { setShown(target); return undefined; }
    // Once it has counted up, later changes (such as fresh data from the API) do not replay the count from 0.
    if (started.current) { setShown(target); return undefined; }
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      started.current = true;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [target, duration]);

  return <span ref={ref} className="count-up">{prefix}{shown}{suffix}</span>;
}

interface CarouselProps {
  children: ReactNode;
  label: string;
  className?: string;
  reveal?: string;
  /** Moves to the next slide every this many milliseconds, back to the start after the last. Pauses on hover and focus. */
  autoPlay?: number;
}

// Scroll-snap slider with arrow buttons and a progress bar. Native swipe on touch screens.
export function Carousel({ children, label, className = '', reveal = 'stagger', autoPlay }: CarouselProps) {
  const track = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const [state, setState] = useState({ start: true, end: false, progress: 0 });
  const items = React.Children.toArray(children) as ReactElement[];

  useEffect(() => {
    const element = track.current;
    if (!element) return undefined;
    const update = () => {
      const max = element.scrollWidth - element.clientWidth;
      const left = element.scrollLeft;
      setState({ start: left <= 2, end: left >= max - 2, progress: max > 0 ? left / max : 1 });
    };
    update();
    element.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { element.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, [items.length]);

  useEffect(() => {
    if (!autoPlay || prefersReducedMotion()) return undefined;
    const timer = window.setInterval(() => {
      const element = track.current;
      if (!element || paused.current || document.hidden || element.scrollWidth <= element.clientWidth) return;
      if (element.scrollLeft >= element.scrollWidth - element.clientWidth - 2) element.scrollTo({ left: 0, behavior: 'smooth' });
      else move(1);
    }, autoPlay);
    return () => window.clearInterval(timer);
  }, [autoPlay, items.length]);

  const move = (direction: 1 | -1) => {
    const element = track.current;
    const slide = element?.firstElementChild;
    if (!element || !slide) return;
    const gap = parseFloat(getComputedStyle(element).columnGap) || 0;
    element.scrollBy({ left: direction * (slide.getBoundingClientRect().width + gap), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const pause = (value: boolean) => () => { paused.current = value; };
  return <div className={'carousel ' + className} ref={root} onMouseEnter={pause(true)} onMouseLeave={pause(false)} onFocus={pause(true)}
    onBlur={(event) => { if (!root.current?.contains(event.relatedTarget as Node)) paused.current = false; }}>
    <div className="carousel-track" ref={track} role="region" aria-label={label} tabIndex={0} data-reveal={reveal}
      onKeyDown={(event) => { if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } }}>
      {items.map((child, index) => <div className="carousel-slide" key={child.key ?? index}>{child}</div>)}
    </div>
    <div className="carousel-controls">
      <div className="carousel-progress" aria-hidden="true"><span style={{ transform: `scaleX(${Math.max(0.08, state.progress)})` }} /></div>
      <button type="button" className="carousel-arrow" aria-label="Previous" disabled={state.start} onClick={() => move(-1)}><Arrow flip /></button>
      <button type="button" className="carousel-arrow carousel-arrow-next" aria-label="Next" disabled={state.end} onClick={() => move(1)}><Arrow /></button>
    </div>
  </div>;
}

function Arrow({ flip = false }: { flip?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={flip ? { transform: 'scaleX(-1)' } : undefined}><path d="M4 12h15" /><path d="m13 5 7 7-7 7" /></svg>;
}

// Infinite horizontal ticker; content is rendered twice so the loop is seamless.
export function Marquee({ items }: { items: ReactNode[] }) {
  const row = (hidden: boolean) => <div className="marquee-row" aria-hidden={hidden || undefined}>
    {items.map((item, index) => <span className="marquee-item" key={index}>{item}</span>)}
  </div>;
  return <div className="marquee"><div className="marquee-track">{row(false)}{row(true)}</div></div>;
}
