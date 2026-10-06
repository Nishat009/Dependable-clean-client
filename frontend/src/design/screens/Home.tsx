import React, { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppSelector } from '../../store';
import ButtonLink from '../components/ButtonLink';
import HeroSlider from '../components/HeroSlider';
import Icon, { type IconName } from '../components/Icon';
import { Carousel, CountUp, Marquee } from '../components/Motion';
import Product from '../components/Product';
import ReviewCard from '../components/ReviewCard';
import SectionIntro from '../components/SectionIntro';
import ServiceCard from '../components/ServiceCard';
import { offers } from '../data';
import { useEarliestBookingDate } from '../hooks/useEarliestBookingDate';
import { useRemote } from '../hooks/useRemote';
import type { Review } from '../types';

const steps: { number: string; title: string; text: string; icon: IconName }[] = [
  { number: '01', title: 'Choose your clean', text: 'Pick the service that fits your space and the way you live.', icon: 'search' },
  { number: '02', title: 'Make it yours', text: 'Choose a date and add the small details that matter to you.', icon: 'calendar' },
  { number: '03', title: 'Breathe easy', text: 'Come back to a beautifully cared-for, feel-good space.', icon: 'sparkle' },
];

const values: { icon: IconName; label: string }[] = [
  { icon: 'sparkle', label: 'Thoughtful cleaning' },
  { icon: 'calendar', label: 'Flexible booking' },
  { icon: 'shield', label: 'Care in every detail' },
  { icon: 'home', label: 'Made for real homes' },
  { icon: 'clock', label: 'Simple from the first click' },
  { icon: 'check', label: 'A fresh finish you can feel' },
];

function QuickBook() {
  const router = useRouter();
  const services = useAppSelector((state) => state.services.items);
  const [selected, setSelected] = useState('');
  const [date, setDate] = useState('');
  const earliest = useEarliestBookingDate();

  function submit(event: FormEvent) {
    event.preventDefault();
    const destination = selected ? '/book/' + selected : '/book';
    router.push(date ? destination + '?date=' + encodeURIComponent(date) : destination);
  }

  return <form className="quick-book wrap" onSubmit={submit}>
    <div className="quick-book-intro"><span className="quick-book-icon"><Icon name="sparkle" size={24} /></span><div><strong>Book your fresh start</strong><small>Book at least 3 days ahead</small></div></div>
    <label><span>SERVICE</span><select value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Choose a service</option>{services.map((service) => <option key={service._id} value={service._id}>{service.serviceName}</option>)}</select></label>
    <label><span>PREFERRED DATE</span><input aria-label="Preferred date" type="date" min={earliest || undefined} value={date} onChange={(event) => setDate(event.target.value)} /></label>
    <button className="button quick-book-submit" type="submit"><span>Find my clean</span><Icon name="arrowUp" size={18} /></button>
  </form>;
}

export default function Home() {
  const services = useAppSelector((state) => state.services.items);
  // Only reviews an admin has approved come back from /reviews.
  const { data: reviews } = useRemote<Review[]>('/reviews', []);

  return <main>
    <HeroSlider><QuickBook /></HeroSlider>

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
            <div className="offer-visual"><Product type={offer.product} wide /></div>
            <p>{offer.text}</p>
            <div className="offer-bottom"><strong className="offer-percent"><CountUp value={offer.percent} suffix="%" duration={1100} /><small>off</small></strong><Link className="offer-link" href={'/book/' + offer.serviceId} aria-label={'Claim ' + offer.tag + ' offer'}><Icon name="arrowUp" size={20} /></Link></div>
          </article>)}
        </Carousel>
      </div>
    </section>

    <section className="section reviews-section" id="reviews">
      <div className="wrap">
        <div className="section-header-row" data-reveal>
          <SectionIntro label="GOOD WORDS" title={<>The feeling<br /><em>says it all.</em></>} description="Little moments after a big refresh, in our customers' own words." dark />
          <div className="review-stars"><span>{[0, 1, 2, 3, 4].map((star) => <i key={star}>★</i>)}</span><small>{reviews.length ? reviews.length + (reviews.length === 1 ? ' review' : ' reviews') + ' from real orders' : 'Care worth coming home to'}</small></div>
        </div>
        {reviews.length
          ? <Carousel label="Customer reviews" className="review-carousel" autoPlay={5500}>
            {reviews.map((review) => <ReviewCard key={review._id} review={review} />)}
          </Carousel>
          : <article className="review-card review-card-empty" data-reveal><Icon name="sparkle" size={30} /><h3>Your fresh start is next.</h3><p>Book a clean and tell us what a refreshed space feels like to you.</p><ButtonLink href="/book">Explore services</ButtonLink></article>}
      </div>
    </section>
  </main>;
}
