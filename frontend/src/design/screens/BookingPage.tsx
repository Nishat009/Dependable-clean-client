import React, { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppSelector } from '../../store';
import { api, errorMessage, jsonOptions } from '../api';
import { useAuth } from '../Auth';
import ButtonLink from '../components/ButtonLink';
import Icon from '../components/Icon';
import { CountUp } from '../components/Motion';
import Notice from '../components/Notice';
import Product, { productFor } from '../components/Product';
import { BOOKING_LEAD_DAYS } from '../data';
import { useEarliestBookingDate } from '../hooks/useEarliestBookingDate';
import { useRemote } from '../hooks/useRemote';
import type { Location, Service } from '../types';

function ServiceFacts({ service }: { service: Service }) {
  const team = service.teamSize || 1;
  const facts = [
    { icon: 'clock' as const, title: 'Time well spent', text: service.duration || 'Flexible timing' },
    { icon: 'users' as const, title: 'Your team', text: team + (team === 1 ? ' trained cleaner' : ' trained cleaners') },
    { icon: 'home' as const, title: 'Ideal for', text: service.idealFor || 'Made for the way you live' },
    { icon: 'shield' as const, title: 'Supplies', text: service.suppliesIncluded === false ? 'Please have your own supplies ready' : 'We bring eco-friendly supplies' },
  ];
  return <div className="booking-facts">
    {facts.map((fact) => <div className="booking-feature" key={fact.title}><Icon name={fact.icon} size={22} /><div><strong>{fact.title}</strong><span>{fact.text}</span></div></div>)}
  </div>;
}

export default function BookingPage({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const service = useAppSelector((state) => state.services.items.find((item) => item._id === id));
  const { data: locations } = useRemote<Location[]>('/locations', []);
  const earliest = useEarliestBookingDate();
  const [date, setDate] = useState('');
  const [locationId, setLocationId] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // A service with no locations listed is offered everywhere.
  const covered = service?.locations?.length ? locations.filter((location) => service.locations?.includes(location._id)) : locations;

  useEffect(() => {
    const wanted = router.query.date;
    if (typeof wanted === 'string' && earliest && wanted >= earliest) setDate(wanted);
  }, [router.query.date, earliest]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user) { router.push('/login?from=' + encodeURIComponent(router.asPath)); return; }
    if (!service) return;
    if (date < earliest) { setNotice(`Please choose a date at least ${BOOKING_LEAD_DAYS} days from today.`); return; }
    setBusy(true); setNotice('');
    try {
      await api('/addAllBook', jsonOptions('POST', { serviceId: id, date, locationId: locationId || undefined, address, notes }));
      router.push('/bookList?booked=1');
    } catch (cause) { setNotice(errorMessage(cause)); setBusy(false); }
  }

  if (!service) return <main className="public-page"><div className="wrap page-hero"><h1>Service not found.</h1><ButtonLink href="/book">Explore services</ButtonLink></div></main>;

  return <main className="public-page"><div className="wrap booking-layout">
    <div className="booking-copy">
      <Link href="/book" className="back-link"><Icon name="arrow" size={17} /> All services</Link>
      <span className="eyebrow"><span className="eyebrow-dot" /> {service.category || 'CLEANING SERVICE'}</span>
      <h1>{service.serviceName}<span className="lime-dot">.</span></h1>
      <p>{service.details}</p>
      <ServiceFacts service={service} />
      {Boolean(service.includes?.length) && <div className="included">
        <h2>What's included</h2>
        <ul>{service.includes?.map((item) => <li key={item}><Icon name="check" size={17} />{item}</li>)}</ul>
      </div>}
      {covered.length > 0 && <p className="booking-areas"><Icon name="pin" size={17} /> Available in {covered.map((location) => location.name).join(', ')}</p>}
      <div className="booking-art"><Product type={productFor(service, 0)} className="booking-product" described /></div>
    </div>
    <div className="form-card booking-card">
      <span className="eyebrow"><span className="eyebrow-dot" /> MAKE IT YOURS</span>
      <h2>Let's get<br /><em>started.</em></h2>
      <div className="price-row"><span>Starting from</span><strong><CountUp value={Math.round(Number(service.price) || 0)} prefix="$" duration={900} /></strong></div>
      <Notice message={notice} type="error" onClose={() => setNotice('')} />
      <form onSubmit={submit} className="stack-form">
        <label>Preferred date
          <input required type="date" min={earliest || undefined} value={date} onChange={(event) => setDate(event.target.value)} />
          <small className="field-hint">Book at least {BOOKING_LEAD_DAYS} days ahead so we can plan your team.</small>
        </label>
        {locations.length > 0 && <label>Location
          <select required value={locationId} onChange={(event) => setLocationId(event.target.value)}>
            <option value="">Choose your area</option>
            {covered.map((location) => <option key={location._id} value={location._id}>{location.name}{location.city ? ' · ' + location.city : ''}</option>)}
          </select>
        </label>}
        <label>Service address<input required placeholder="Street address, apartment, floor" value={address} onChange={(event) => setAddress(event.target.value)} /></label>
        <label>Anything we should know?<textarea rows={4} placeholder="Tell us about your space or any special requests" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
        <button className="button" disabled={busy} type="submit"><span>{busy ? 'Sending request…' : user ? 'Request this clean' : 'Sign in to request'}</span><Icon name="arrowUp" size={19} /></button>
      </form>
      <p className="form-footnote">We will confirm your booking details with you. No payment is taken here.</p>
    </div>
  </div></main>;
}
