import { businessConfig } from '../data';
import React, { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAppSelector } from '../../store';
import { api, errorMessage, jsonOptions } from '../api';
import { useAuth } from '../Auth';
import ButtonLink from '../components/ButtonLink';
import DatePicker from '../components/DatePicker';
import Icon from '../components/Icon';
import { CountUp } from '../components/Motion';
import Notice from '../components/Notice';
import Product, { productFor } from '../components/Product';
import Select from '../components/Select';
import { BOOKING_LEAD_DAYS, describeLocation } from '../data';
import { useEarliestBookingDate } from '../hooks/useEarliestBookingDate';
import { useRemote } from '../hooks/useRemote';
import type { Location, Service } from '../types';

function ServiceFacts({ service }: { service: Service }) {
  const team = service.teamSize || 1;
  const facts = [
    { icon: 'clock' as const, title: 'Time well spent', text: service.duration || 'Flexible timing' },
    { icon: 'users' as const, title: 'Your team', text: team + (team === 1 ? ' cleaner' : ' cleaners') },
    { icon: 'home' as const, title: 'Ideal for', text: service.idealFor || 'Made for the way you live' },
    { icon: 'shield' as const, title: 'Supplies', text: service.suppliesIncluded === false ? 'Please have your own supplies ready' : 'Supplies included' },
  ];
  return <div className="booking-facts">
    {facts.map((fact) => <div className="booking-feature" key={fact.title}><Icon name={fact.icon} size={22} /><div><strong>{fact.title}</strong><span>{fact.text}</span></div></div>)}
  </div>;
}

export default function BookingPage({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const service = useAppSelector((state) => state.services.items.find((item) => item._id === id));
  const { data: locations, loading: locationsLoading } = useRemote<Location[]>('/locations', []);
  const earliest = useEarliestBookingDate();
  const [date, setDate] = useState('');
  const [locationId, setLocationId] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // Each area sits in one Dhaka thana, and the server only accepts a booking whose thana matches its area,
  // so the thana comes from the chosen area. An area saved without a thana cannot be booked.
  const bookable = locations.filter((location) => location.thana);
  const area = bookable.find((location) => location._id === locationId);
  const noAreas = !locationsLoading && !bookable.length;

  useEffect(() => {
    const wanted = router.query.date;
    if (typeof wanted === 'string' && earliest && wanted >= earliest) setDate(wanted);
  }, [router.query.date, earliest]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user) { router.push('/login?from=' + encodeURIComponent(router.asPath)); return; }
    if (!service) return;
    if (noAreas) { setNotice('We are not taking bookings in any area right now. Please check back soon.'); return; }
    if (!area) { setNotice('Please choose your service area.'); return; }
    if (!address.trim()) { setNotice('Please enter the service address.'); return; }
    if (date < earliest) { setNotice(`Please choose a date at least ${BOOKING_LEAD_DAYS} days from today.`); return; }
    setBusy(true); setNotice('');
    try {
      await api('/addAllBook', jsonOptions('POST', { serviceId: id, date, locationId: area._id, address, thana: area.thana, notes }));
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
      {bookable.length > 0 && <p className="booking-areas"><Icon name="pin" size={17} /> Available in {bookable.map((location) => location.name).join(', ')}</p>}
      <div className="booking-art"><Product type={productFor(service, 0)} className="booking-product" described /></div>
    </div>
    <div className="form-card booking-card">
      <span className="eyebrow"><span className="eyebrow-dot" /> MAKE IT YOURS</span>
      <h2>Let's get<br /><em>started.</em></h2>
      <div className="price-row"><span>Starting from</span><strong><CountUp value={Math.round(Number(service.price) || 0)} prefix={(businessConfig.currency) + " "} duration={900} /></strong></div>
      <Notice message={notice} type="error" onClose={() => setNotice('')} />
      <p>A request is not confirmed until the business owner confirms it.</p><form onSubmit={submit} className="stack-form">
        <div className="field-stack">
          <DatePicker label="Preferred date" required placeholder="Choose a day" min={earliest || undefined} value={date} onChange={setDate} />
          <small className="field-hint">Book at least {BOOKING_LEAD_DAYS} days ahead so we can plan your team.</small>
        </div>
        <div className="field-stack">
          <Select label="Service area" required searchable={bookable.length > 8} value={locationId} onChange={setLocationId}
            placeholder={locationsLoading ? 'Loading service areas…' : noAreas ? 'No service areas yet' : 'Choose your area'}
            options={bookable.map((location) => ({ value: location._id, label: location.name, hint: describeLocation(location) }))} />
          {area && <small className="field-hint"><Icon name="pin" size={12} /> Thana: {area.thana}, Dhaka</small>}
          {noAreas && <small className="field-hint">No service areas are open right now.</small>}
        </div>
        <label>Service address<input required placeholder="House, road, apartment, floor" value={address} onChange={(event) => setAddress(event.target.value)} /></label>
        <label>Anything we should know?<textarea rows={4} placeholder="Tell us about your space or any special requests" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
        <button className="button" disabled={busy || noAreas} type="submit"><span>{busy ? 'Sending request…' : user ? 'Request this clean' : 'Sign in to request'}</span><Icon name="arrowUp" size={19} /></button>
      </form>
      <p className="form-footnote">We will confirm your booking details with you. No payment is taken here.</p>
    </div>
  </div></main>;
}
