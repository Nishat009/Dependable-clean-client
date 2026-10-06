import React, { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../store';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { CountUp } from '../components/Motion';
import ServiceCard from '../components/ServiceCard';
import { serviceCategories } from '../data';

type Category = typeof serviceCategories[number];
interface Pill { left: number; top: number; width: number; height: number }

export default function ServicesPage() {
  const services = useAppSelector((state) => state.services.items);
  const [category, setCategory] = useState<Category>('All services');
  const visible = category === 'All services' ? services : services.filter((service) => service.category === category);
  const filterRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<Pill | null>(null);

  useEffect(() => {
    const place = () => {
      const active = filterRef.current?.querySelector<HTMLButtonElement>('button.active');
      if (active) setPill({ left: active.offsetLeft, top: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [category]);

  return <main className="public-page">
    <div className="page-hero wrap">
      <span className="eyebrow"><span className="eyebrow-dot" /> OUR SERVICES</span>
      <h1 className="page-title"><span className="line"><span>Find your</span></span><span className="line"><span><em>fresh feeling.</em></span></span></h1>
      <p>Every space deserves the right kind of care. Explore our thoughtful cleaning services and choose what feels right for you.</p>
      <span className="page-hero-spark"><Icon name="sparkle" size={84} /></span>
    </div>
    <section className="wrap catalog-section">
      <div className="catalog-bar">
        <div className={'filter-list' + (pill ? ' has-pill' : '')} ref={filterRef} role="group" aria-label="Filter services">
          {pill && <span className="filter-pill" aria-hidden="true" style={{ transform: `translate(${pill.left}px, ${pill.top}px)`, width: pill.width, height: pill.height }} />}
          {serviceCategories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)} className={category === item ? 'active' : ''}>{item}</button>)}
        </div>
        <span><CountUp value={visible.length} duration={600} /> SERVICES</span>
      </div>
      <div className="service-grid catalog-grid" key={category}>
        {visible.map((service, index) => <ServiceCard key={service._id} service={service} index={index} total={visible.length} />)}
      </div>
      {!visible.length && <EmptyState title="Nothing in this category yet" text="Try a different category to find your clean." />}
    </section>
  </main>;
}
