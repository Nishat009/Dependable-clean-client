import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import Icon from './Icons';
import { api } from './api';
import { ButtonLink, Footer, Header, SectionIntro, ServiceCard } from './Layout';
import { Carousel, CountUp, Marquee } from './Motion';
import Product from './Products';
import { offers } from './data';

const steps = [
  { number: '01', title: 'Choose your clean', text: 'Pick the service that fits your space and the way you live.', icon: 'search' },
  { number: '02', title: 'Make it yours', text: 'Choose a date and add the small details that matter to you.', icon: 'calendar' },
  { number: '03', title: 'Breathe easy', text: 'Come back to a beautifully cared-for, feel-good space.', icon: 'sparkle' },
];

const values = [
  { icon: 'sparkle', label: 'Thoughtful cleaning' },
  { icon: 'calendar', label: 'Flexible booking' },
  { icon: 'shield', label: 'Care in every detail' },
  { icon: 'home', label: 'Made for real homes' },
  { icon: 'clock', label: 'Simple from the first click' },
  { icon: 'check', label: 'A fresh finish you can feel' },
];

export default function Home() {
  const router = useRouter();
  const services = useSelector((state) => state.services.items);
  const [selected, setSelected] = useState('');
  const [date, setDate] = useState('');
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api('/reviews').then((items) => setReviews(Array.isArray(items) ? items : [])).catch(() => setReviews([]));
  }, []);

  function handleQuickBook(event) {
    event.preventDefault();
    const destination = selected ? '/book/' + selected : '/book';
    router.push(date ? destination + '?date=' + encodeURIComponent(date) : destination);
  }

  return <>
    <Header />
    <main>
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-image" role="img" aria-label="Premium cleaning products, brush and freshly folded cloth on a spotless surface" />
          <div className="hero-overlay" aria-hidden="true" />
          <span className="hero-orb hero-orb-one" aria-hidden="true" /><span className="hero-orb hero-orb-two" aria-hidden="true" />
        </div>
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow"><span className="eyebrow-dot" /> CLEANING, REIMAGINED</span>
            <h1 className="hero-title">
              <span className="line"><span>A cleaner</span></span>
              <span className="line"><span>space. <em>A lighter</em></span></span>
              <span className="line"><span>life<span className="hero-period">.</span></span></span>
            </h1>
            <p>Thoughtful care for the spaces that make life happen. Beautifully clean, effortlessly yours.</p>
            <div className="hero-actions">
              <ButtonLink href="/book">Explore services</ButtonLink>
              <Link className="text-link" href="/#process">See how it works <Icon name="arrow" size={19} /></Link>
            </div>
            <div className="hero-proof"><span className="hero-proof-icon"><Icon name="sparkle" size={17} /></span><span>Made for real homes. Designed for peace of mind.</span></div>
          </div>
        </div>
        <form className="quick-book wrap" onSubmit={handleQuickBook}>
          <div className="quick-book-intro"><span className="quick-book-icon"><Icon name="sparkle" size={24} /></span><div><strong>Book your fresh start</strong><small>Simple from the very first click</small></div></div>
          <label><span>SERVICE</span><select value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Choose a service</option>{services.map((service) => <option key={service._id} value={service._id}>{service.serviceName}</option>)}</select></label>
          <label><span>PREFERRED DATE</span><input aria-label="Preferred date" type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <button className="button quick-book-submit" type="submit"><span>Find my clean</span><Icon name="arrowUp" size={18} /></button>
        </form>
      </section>

      <div className="value-strip">
        <Marquee items={values.map((value) => <><Icon name={value.icon} size={20} /> {value.label}</>)} />
      </div>

      <section className="section services-section" id="services">
        <div className="wrap">
          <div className="section-header-row" data-reveal>
            <SectionIntro label="OUR SERVICES" title={<>A fresh feeling,<br /><em>for every space.</em></>} description="From the everyday reset to a deep, satisfying clean, find the care your space deserves." dark />
            <ButtonLink href="/book" outline>View all services</ButtonLink>
          </div>
          <Carousel label="Our services" className="service-carousel">
            {services.map((service, index) => <ServiceCard key={service._id} service={service} index={index} total={services.length} />)}
          </Carousel>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="wrap about-grid">
          <div className="about-image-wrap" data-reveal="clip"><img src="/visuals/bright-room.jpg" alt="A bright and freshly cared-for living room" /><span className="about-image-stamp"><Icon name="sparkle" size={27} /> FEEL<br />THE<br />FRESH</span></div>
          <div className="about-copy">
            <div data-reveal><SectionIntro label="THE DEPENDABLE WAY" title={<>More than clean.<br /><em>A feeling.</em></>} description="A beautifully clean space changes how the whole day feels. We care about the small details, the quiet corners, and the welcome-home moment." /></div>
            <div className="about-points" data-reveal="stagger"><div><Icon name="check" size={19} /><span>Care tailored to your space</span></div><div><Icon name="check" size={19} /><span>Simple booking, less to think about</span></div><div><Icon name="check" size={19} /><span>A fresh finish you can feel</span></div></div>
            <div className="about-stats" data-reveal="stagger">
              <div><strong><CountUp value={services.length} /></strong><span>Services to choose from</span></div>
              <div><strong><CountUp value={3} /></strong><span>Simple steps to book</span></div>
              <div><strong><CountUp value={100} suffix="%" /></strong><span>Made for your space</span></div>
            </div>
            <div data-reveal><ButtonLink href="/book">Find your service</ButtonLink></div>
          </div>
        </div>
      </section>

      <section className="section process-section" id="process">
        <div className="wrap">
          <div className="section-header-row" data-reveal>
            <SectionIntro label="HOW IT WORKS" title={<>Three steps to<br /><em>a fresher home.</em></>} description="A considered clean, without the complicated process." dark />
            <span className="process-decoration"><Icon name="sparkle" size={32} /></span>
          </div>
          <div className="steps" data-reveal="steps">
            <div className="steps-track" aria-hidden="true"><span className="steps-track-fill" /><span className="steps-track-dot" /></div>
            <div className="steps-grid">{steps.map((step) => <div className="step-card" key={step.number}><span className="step-number">{step.number}</span><div className="step-icon"><Icon name={step.icon} size={28} /></div><h3>{step.title}</h3><p>{step.text}</p></div>)}</div>
          </div>
        </div>
      </section>

      <section className="section offers-section" id="offers">
        <div className="wrap">
          <div className="section-header-row" data-reveal>
            <SectionIntro label="FRESH OFFERS" title={<>A little extra,<br /><em>for a fresher home.</em></>} description="Seasonal savings on the cleans our clients book most. Swipe through and pick yours." />
          </div>
          <Carousel label="Fresh offers" className="offer-carousel">
            {offers.map((offer) => <article className="offer-card" key={offer.tag}>
              <div className="offer-top"><span className="offer-chip"><Icon name="sparkle" size={13} /> Limited offer</span><span className="offer-tag">{offer.tag}</span></div>
              <div className="offer-visual"><span className="offer-glow" aria-hidden="true" /><Product type={offer.product} /></div>
              <p>{offer.text}</p>
              <div className="offer-bottom"><strong className="offer-percent"><CountUp value={offer.percent} suffix="%" duration={1100} /><small>off</small></strong><Link className="offer-link" href={'/book/' + offer.serviceId} aria-label={'Claim ' + offer.tag + ' offer'}><Icon name="arrowUp" size={20} /></Link></div>
            </article>)}
          </Carousel>
        </div>
      </section>

      <section className="section reviews-section" id="reviews">
        <div className="wrap reviews-grid">
          <div data-reveal><SectionIntro label="GOOD WORDS" title={<>The feeling<br /><em>says it all.</em></>} description="Little moments after a big refresh." dark /><div className="review-stars"><span>{[0, 1, 2, 3, 4].map((star) => <i key={star}>★</i>)}</span><small>Care worth coming home to</small></div></div>
          <div className="review-stack" data-reveal="stagger-right">
            {reviews.length ? reviews.slice(0, 2).map((review, index) => <article className="review-card" key={review._id || index}><Icon name="sparkle" size={24} /><blockquote>“{review.comments}”</blockquote><div className="review-person"><span className="avatar">{(review.name || 'G').charAt(0)}</span><span><strong>{review.name || 'Happy customer'}</strong><small>{review.demo ? 'Local preview review' : 'Dependable Clean client'}</small></span></div></article>)
              : <article className="review-card"><Icon name="sparkle" size={30} /><h3>Your fresh start is next.</h3><p>Book a clean and tell us what a refreshed space feels like to you.</p><ButtonLink href="/book">Explore services</ButtonLink></article>}
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </>;
}
