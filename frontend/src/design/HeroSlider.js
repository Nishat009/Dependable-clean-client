import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import Icon from './Icons';
import Product from './Products';
import { ButtonLink } from './Layout';
import { formatMoney, heroSlides } from './data';
import { prefersReducedMotion } from './Motion';

const AUTOPLAY_MS = 6000;
const pad = (value) => String(value).padStart(2, '0');

// Home hero: cleaning products slide in and out like a product showcase.
// Tabs, arrows, swipe and arrow keys all move the slider; it autoplays until the visitor interacts.
export default function HeroSlider({ children }) {
  const services = useSelector((state) => state.services.items);
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState(null);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const touch = useRef(null);
  const tabs = useRef([]);
  const count = heroSlides.length;

  function go(next, dir) {
    const target = (next + count) % count;
    if (target === index) return;
    setPrevious(index);
    setDirection(dir ?? (target > index ? 1 : -1));
    setIndex(target);
  }

  useEffect(() => { setAutoplay(!prefersReducedMotion()); }, []);
  useEffect(() => {
    if (!autoplay || paused) return undefined;
    const timer = setTimeout(() => {
      setPrevious(index);
      setDirection(1);
      setIndex((index + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [autoplay, paused, index, count]);
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const slide = heroSlides[index];
  const service = services.find((item) => item._id === slide.serviceId) || services[index % Math.max(services.length, 1)];
  const href = service ? '/book/' + service._id : '/book';
  const stats = [slide.stat, [service?.duration?.replace(' hours', 'h').replace(' hour', 'h') || 'Flexible', 'Visit length'], [formatMoney(service?.price), 'Starting from']];

  function onTabKey(event) {
    const keys = { ArrowRight: 1, ArrowLeft: -1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const target = (index + keys[event.key] + count) % count;
    go(target, keys[event.key]);
    tabs.current[target]?.focus();
  }

  return <section className={'hs' + (paused ? ' is-paused' : '')} style={{ '--accent': slide.accent, '--autoplay': AUTOPLAY_MS + 'ms' }}
    aria-roledescription="carousel" aria-label="Featured cleaning products"
    onFocus={() => setPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
    <div className="hs-bg" aria-hidden="true"><span className="hs-grid" /><span className="hs-glow" /></div>

    <div className="wrap hs-inner">
      <div className="hs-head">
        <span className="eyebrow hero-eyebrow"><span className="eyebrow-dot" /> CLEANING, REIMAGINED</span>
        <h1 className="hero-title">
          <span className="line"><span>A cleaner space.</span></span>
          <span className="line"><span><em>A lighter</em> life<span className="hero-period">.</span></span></span>
        </h1>
        <p>Thoughtful care and the good stuff we bring with it. Pick a space to see the kit.</p>
      </div>

      <div className="hs-tabs" role="tablist" aria-label="Choose a space" onKeyDown={onTabKey}>
        {heroSlides.map((item, i) => <button key={item.tab} ref={(node) => { tabs.current[i] = node; }} type="button" role="tab" id={'hs-tab-' + i}
          aria-selected={i === index} aria-controls="hs-panel" tabIndex={i === index ? 0 : -1}
          className={'hs-tab' + (i === index ? ' is-active' : '')} onClick={() => go(i)}>
          {item.tab}
          {i === index && autoplay && <span className="hs-tab-progress" key={index} aria-hidden="true" />}
        </button>)}
      </div>

      <dl className="hs-stats">
        {stats.map(([value, label], i) => <div key={i} style={{ '--i': i }}><dt>{label}</dt><dd><span className="hs-roll"><span key={index}>{value}</span></span></dd></div>)}
      </dl>

      <div className="hs-actions">
        <ButtonLink href={href}>Book {service?.serviceName || 'this clean'}</ButtonLink>
        <Link className="text-link" href="/#process">How it works <Icon name="arrow" size={19} /></Link>
      </div>

      <div className="hs-stage" id="hs-panel" role="tabpanel" aria-labelledby={'hs-tab-' + index} style={{ '--dir': direction }}
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
        onTouchStart={(event) => { touch.current = event.touches[0].clientX; }}
        onTouchEnd={(event) => {
          if (touch.current == null) return;
          const delta = event.changedTouches[0].clientX - touch.current;
          touch.current = null;
          if (Math.abs(delta) > 45) go(index + (delta < 0 ? 1 : -1), delta < 0 ? 1 : -1);
        }}>
        <span className="hs-ring hs-ring-one" aria-hidden="true" /><span className="hs-ring hs-ring-two" aria-hidden="true" />
        <span className="hs-floor" aria-hidden="true" />
        {heroSlides.map((item, i) => <div key={item.product} className={'hs-slide' + (i === index ? ' is-active' : i === previous ? ' is-leaving' : '')} aria-hidden={i !== index}>
          <Product type={item.product} title={i === index ? item.name : undefined} />
        </div>)}
        <span className="hs-bubbles" aria-hidden="true"><i /><i /><i /><i /><i /></span>
        <div className="hs-caption" key={'c' + index}>
          <span className="hs-caption-dot" />
          <span><small>Now in the kit</small><strong>{slide.name}</strong></span>
        </div>
        <div className="hs-nav">
          <span className="hs-count" aria-live="polite"><strong>{pad(index + 1)}</strong> / {pad(count)}</span>
          <button type="button" className="carousel-arrow hs-arrow" aria-label="Previous product" onClick={() => go(index - 1, -1)}><Icon name="arrow" size={18} className="flip-x" /></button>
          <button type="button" className="carousel-arrow carousel-arrow-next hs-arrow" aria-label="Next product" onClick={() => go(index + 1, 1)}><Icon name="arrow" size={18} /></button>
        </div>
      </div>
    </div>
    {children}
  </section>;
}
