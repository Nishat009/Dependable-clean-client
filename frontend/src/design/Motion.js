import React, { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Watches every [data-reveal] element (including ones rendered later) and adds .is-visible once it scrolls into view.
export function useRevealObserver(path) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('motion-ready');
    const reveal = (element) => element.classList.add('is-visible');
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
    const watch = (scope) => scope.querySelectorAll?.('[data-reveal]:not(.is-visible)').forEach((element) => intersection.observe(element));
    watch(document);
    const mutation = new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType !== 1) return;
      if (node.matches('[data-reveal]:not(.is-visible)')) intersection.observe(node);
      watch(node);
    })));
    mutation.observe(document.body, { childList: true, subtree: true });
    return () => { intersection.disconnect(); mutation.disconnect(); };
  }, [path]);
}

// Counts from 0 to `value` the first time it becomes visible.
export function CountUp({ value, prefix = '', suffix = '', duration = 1400 }) {
  const target = Number(value) || 0;
  const ref = useRef(null);
  const [shown, setShown] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) { setShown(target); return undefined; }
    let frame;
    const run = () => {
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        setShown(Math.round(target * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    if (started.current) { run(); return () => cancelAnimationFrame(frame); }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      started.current = true;
      observer.disconnect();
      run();
    }, { threshold: 0.4 });
    observer.observe(element);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [target, duration]);

  return <span ref={ref} className="count-up">{prefix}{shown}{suffix}</span>;
}

// Infinite horizontal ticker; content is rendered twice so the loop is seamless.
export function Marquee({ items }) {
  const row = (hidden) => <div className="marquee-row" aria-hidden={hidden || undefined}>
    {items.map((item, index) => <span className="marquee-item" key={index}>{item}</span>)}
  </div>;
  return <div className="marquee"><div className="marquee-track">{row(false)}{row(true)}</div></div>;
}
