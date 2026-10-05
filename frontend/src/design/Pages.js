import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import Icon from './Icons';
import { useAuth } from './Auth';
import { api, jsonOptions } from './api';
import { demoServices, formatDate, formatMoney, serviceCategories } from './data';
import { setServices } from '../store';
import { ButtonLink, DashboardLayout, EmptyState, Footer, Header, Notice, ServiceCard, StatusBadge } from './Layout';
import { CountUp } from './Motion';

function useRemote(path, fallback = []) {
  const [items, setItems] = useState(fallback);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!path) return;
    let active = true;
    api(path).then((value) => { if (active) setItems(Array.isArray(value) ? value : []); }).catch(() => {});
    return () => { active = false; };
  }, [path, refresh]);
  return [items, () => setRefresh((value) => value + 1)];
}

export function LoginPage() {
  const router = useRouter();
  const { user, signInWithGoogle, signInDemo } = useAuth();
  const [error, setError] = useState('');
  const destination = typeof router.query.from === 'string' && router.query.from.startsWith('/') ? router.query.from : '/dashboard';
  useEffect(() => { if (user) router.replace(destination); }, [user, destination, router]);
  async function googleLogin() {
    try { setError(''); await signInWithGoogle(); router.push(destination); }
    catch (cause) { setError(cause.message || 'Sign in could not be completed.'); }
  }
  function demoLogin(role) { signInDemo(role); router.push(destination); }
  return <><Header /><main className="auth-page"><div className="auth-art"><div className="auth-art-content"><span className="eyebrow"><span className="eyebrow-dot" /> YOUR FRESH START</span><h1>Good things happen in <em>clean spaces.</em></h1><p>Step into a simpler way to care for your space.</p><div className="auth-orbit"><Icon name="sparkle" size={75} /></div></div></div><div className="auth-form-side"><div className="auth-card"><span className="eyebrow"><span className="eyebrow-dot" /> WELCOME BACK</span><h2>Make yourself<br /><em>at home.</em></h2><p>Sign in to book a service and keep track of your fresh starts.</p><Notice message={error} type="error" onClose={() => setError('')} /><button className="button auth-primary" type="button" onClick={googleLogin}><span>Continue with Google</span><Icon name="arrowUp" size={19} /></button>{process.env.NODE_ENV === 'development' && <div className="demo-login"><span>LOCAL PREVIEW</span><button type="button" onClick={() => demoLogin('customer')}>Enter as a customer <Icon name="arrow" size={17} /></button><button type="button" onClick={() => demoLogin('admin')}>Enter as an admin <Icon name="arrow" size={17} /></button></div>}<small>By continuing, you can manage your bookings from one beautiful place.</small></div></div></main><Footer /></>;
}

export function ServicesPage() {
  const services = useSelector((state) => state.services.items);
  const [category, setCategory] = useState('All services');
  const visible = category === 'All services' ? services : services.filter((service) => service.category === category);
  const filterRef = useRef(null);
  const [pill, setPill] = useState(null);
  useEffect(() => {
    const place = () => {
      const active = filterRef.current?.querySelector('button.active');
      if (active) setPill({ left: active.offsetLeft, top: active.offsetTop, width: active.offsetWidth, height: active.offsetHeight });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [category]);
  return <><Header /><main className="public-page"><div className="page-hero wrap"><span className="eyebrow"><span className="eyebrow-dot" /> OUR SERVICES</span><h1 className="page-title"><span className="line"><span>Find your</span></span><span className="line"><span><em>fresh feeling.</em></span></span></h1><p>Every space deserves the right kind of care. Explore our thoughtful cleaning services and choose what feels right for you.</p><span className="page-hero-spark"><Icon name="sparkle" size={84} /></span></div><section className="wrap catalog-section"><div className="catalog-bar"><div className={'filter-list' + (pill ? ' has-pill' : '')} ref={filterRef} role="group" aria-label="Filter services">{pill && <span className="filter-pill" aria-hidden="true" style={{ transform: `translate(${pill.left}px, ${pill.top}px)`, width: pill.width, height: pill.height }} />}{serviceCategories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)} className={category === item ? 'active' : ''}>{item}</button>)}</div><span><CountUp value={visible.length} duration={600} /> SERVICES</span></div><div className="service-grid catalog-grid" key={category}>{visible.map((service, index) => <ServiceCard key={service._id} service={service} index={index} total={visible.length} />)}</div>{!visible.length && <EmptyState title="Nothing in this category yet" text="Try a different category to find your clean." />}</section></main><Footer /></>;
}

export function BookingPage({ id }) {
  const router = useRouter();
  const { user } = useAuth();
  const service = useSelector((state) => state.services.items.find((item) => item._id === id));
  const [date, setDate] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (typeof router.query.date === 'string') setDate(router.query.date); }, [router.query.date]);
  async function submit(event) {
    event.preventDefault();
    if (!user) { router.push('/login?from=' + encodeURIComponent(router.asPath)); return; }
    setBusy(true); setNotice('');
    try {
      await api('/addAllBook', jsonOptions('POST', { serviceId: id, serviceName: service.serviceName, price: Number(service.price), date, address, notes, name: user.name, email: user.email, status: 'Pending', createdAt: new Date().toISOString() }));
      router.push('/bookList?booked=1');
    } catch (error) { setNotice(error.message); setBusy(false); }
  }
  if (!service) return <><Header /><main className="public-page"><div className="wrap page-hero"><h1>Service not found.</h1><ButtonLink href="/book">Explore services</ButtonLink></div></main><Footer /></>;
  return <><Header /><main className="public-page"><div className="wrap booking-layout"><div className="booking-copy"><Link href="/book" className="back-link"><Icon name="arrow" size={17} /> All services</Link><span className="eyebrow"><span className="eyebrow-dot" /> {service.category || 'CLEANING SERVICE'}</span><h1>{service.serviceName}<span className="lime-dot">.</span></h1><p>{service.details}</p><div className="booking-feature"><Icon name="clock" size={22} /><div><strong>Time well spent</strong><span>{service.duration || 'Flexible timing'}</span></div></div><div className="booking-feature"><Icon name="sparkle" size={22} /><div><strong>Care in every detail</strong><span>Made for the way you live</span></div></div><div className="booking-art"><span className="booking-art-orbit" /><Icon name="sparkle" size={105} /></div></div><div className="form-card booking-card"><span className="eyebrow"><span className="eyebrow-dot" /> MAKE IT YOURS</span><h2>Let's get<br /><em>started.</em></h2><div className="price-row"><span>Starting from</span><strong><CountUp value={Math.round(Number(service.price) || 0)} prefix="$" duration={900} /></strong></div><Notice message={notice} type="error" onClose={() => setNotice('')} /><form onSubmit={submit} className="stack-form"><label>Preferred date<input required type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} /></label><label>Service address<input required placeholder="Street address, city" value={address} onChange={(event) => setAddress(event.target.value)} /></label><label>Anything we should know?<textarea rows="4" placeholder="Tell us about your space or any special requests" value={notes} onChange={(event) => setNotes(event.target.value)} /></label><button className="button" disabled={busy} type="submit"><span>{busy ? 'Sending request…' : user ? 'Request this clean' : 'Sign in to request'}</span><Icon name="arrowUp" size={19} /></button></form><p className="form-footnote">We will confirm your booking details with you. No payment is taken here.</p></div></div></main><Footer /></>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [bookings] = useRemote(user?.email ? '/bookingList?email=' + encodeURIComponent(user.email) : null);
  const next = bookings.filter((item) => item.status !== 'Completed').slice(0, 2);
  return <DashboardLayout title={<>Welcome back, <em>{user?.name?.split(' ')[0] || 'friend'}.</em></>} description="A little overview of your cleaner, calmer space."><div className="dashboard-welcome"><div><span className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT FRESH START</span><h2>A clean space is a good place to begin.</h2><p>Make room for the moments that matter. We'll take care of the reset.</p><ButtonLink href="/book">Book a clean</ButtonLink></div><span className="welcome-spark"><Icon name="sparkle" size={118} /></span></div><div className="stat-grid"><div><span>01 / BOOKING</span><strong><CountUp value={bookings.length} duration={900} /></strong><small>Total requests</small></div><div><span>02 / UPCOMING</span><strong><CountUp value={next.length} duration={900} /></strong><small>To look forward to</small></div><div><span>03 / CARE</span><strong><CountUp value={100} suffix="%" /></strong><small>Made for your space</small></div></div><div className="dashboard-section-head"><div><span className="eyebrow"><span className="eyebrow-dot" /> ON THE HORIZON</span><h2>Your bookings</h2></div><Link href="/bookList" className="text-link">View all <Icon name="arrow" size={18} /></Link></div>{next.length ? <div className="booking-list">{next.map((item) => <BookingRow key={item._id} item={item} />)}</div> : <EmptyState title="Your next fresh start awaits" text="Choose a service, pick your date, and let us handle the rest." href="/book" action="Explore services" />}</DashboardLayout>;
}

function BookingRow({ item }) {
  return <article className="booking-row"><div className="row-icon"><Icon name="sparkle" size={25} /></div><div className="row-main"><strong>{item.serviceName || item.bookName || 'Cleaning service'}</strong><span>{formatDate(item.date)} <b>·</b> {item.address || 'Address to confirm'}</span></div><StatusBadge status={item.status} /><strong className="row-price">{formatMoney(item.price)}</strong></article>;
}

export function BookingsPage() {
  const { user } = useAuth();
  const [bookings] = useRemote(user?.email ? '/bookingList?email=' + encodeURIComponent(user.email) : null);
  const booked = useRouter().query.booked;
  return <DashboardLayout title={<>Your <em>bookings.</em></>} description="All your cleaning requests in one easy place.">{booked && <Notice message="Your booking request is in! We will be in touch to confirm the details." />}<div className="dashboard-section-head"><h2>All requests</h2><ButtonLink href="/book">Book another clean</ButtonLink></div>{bookings.length ? <div className="booking-list">{bookings.map((item) => <BookingRow key={item._id} item={item} />)}</div> : <EmptyState title="No bookings yet" text="Your first fresh start is just a few clicks away." href="/book" />}</DashboardLayout>;
}

export function ReviewPage() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    try { await api('/addReview', jsonOptions('POST', { name: user.name, email: user.email, rating, comments })); setComments(''); setNotice('Thank you for sharing your experience!'); setError(''); }
    catch (cause) { setError(cause.message); }
  }
  return <DashboardLayout title={<>Tell us how it <em>felt.</em></>} description="Your words help us make every fresh start a little better."><div className="form-card dashboard-form"><span className="eyebrow"><span className="eyebrow-dot" /> SHARE YOUR EXPERIENCE</span><h2>A note from you.</h2><Notice message={notice} onClose={() => setNotice('')} /><Notice message={error} type="error" onClose={() => setError('')} /><form onSubmit={submit} className="stack-form"><label>Your rating<div className="star-picker" role="group" aria-label="Rating">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={value + ' stars'} aria-pressed={rating === value} className={value <= rating ? 'selected' : ''} onClick={() => setRating(value)}>★</button>)}</div></label><label>Your review<textarea required minLength="10" rows="6" value={comments} onChange={(event) => setComments(event.target.value)} placeholder="What did you love about your clean?" /></label><button className="button" type="submit"><span>Share review</span><Icon name="arrowUp" size={18} /></button></form></div></DashboardLayout>;
}

export function OrdersPage() {
  const [orders, refresh] = useRemote('/orderList');
  const [error, setError] = useState('');
  async function update(id, status) { try { await api('/updateOrderList/' + id, jsonOptions('PATCH', { status })); refresh(); } catch (cause) { setError(cause.message); } }
  return <DashboardLayout eyebrow="ADMIN TOOLS" title={<>All <em>orders.</em></>} description="See and manage cleaning requests across your team."><Notice message={error} type="error" onClose={() => setError('')} /><div className="dashboard-section-head"><h2>Recent requests</h2><span className="result-count">{orders.length} ORDERS</span></div>{orders.length ? <div className="admin-list">{orders.map((item) => <article className="admin-row" key={item._id}><div className="row-icon"><Icon name="calendar" size={22} /></div><div className="row-main"><strong>{item.serviceName || 'Cleaning service'}</strong><span>{item.name || item.email} · {formatDate(item.date)}</span><small>{item.address}</small></div><StatusBadge status={item.status} /><select aria-label={'Status for ' + item.serviceName} value={item.status || 'Pending'} onChange={(event) => update(item._id, event.target.value)}><option>Pending</option><option>Confirmed</option><option>In progress</option><option>Completed</option><option>Cancelled</option></select></article>)}</div> : <EmptyState title="No requests yet" text="New cleaning requests will appear here." />}</DashboardLayout>;
}

export function AddServicePage() {
  const [fields, setFields] = useState({ serviceName: '', details: '', category: 'Home care', duration: '', price: '' });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    try { await api('/addService', jsonOptions('POST', fields)); setNotice('Service added successfully.'); setError(''); setFields({ serviceName: '', details: '', category: 'Home care', duration: '', price: '' }); }
    catch (cause) { setError(cause.message); }
  }
  return <DashboardLayout eyebrow="ADMIN TOOLS" title={<>Add a <em>service.</em></>} description="Create a new way to help customers feel at home."><div className="form-card dashboard-form"><span className="eyebrow"><span className="eyebrow-dot" /> SERVICE DETAILS</span><h2>The next fresh start.</h2><Notice message={notice} onClose={() => setNotice('')} /><Notice message={error} type="error" onClose={() => setError('')} /><form onSubmit={submit} className="stack-form"><label>Service name<input required value={fields.serviceName} onChange={(event) => setFields({ ...fields, serviceName: event.target.value })} placeholder="e.g. Weekend home reset" /></label><div className="form-two"><label>Category<select value={fields.category} onChange={(event) => setFields({ ...fields, category: event.target.value })}>{serviceCategories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label>Starting price ($)<input required min="1" type="number" value={fields.price} onChange={(event) => setFields({ ...fields, price: event.target.value })} /></label></div><label>Estimated duration<input value={fields.duration} onChange={(event) => setFields({ ...fields, duration: event.target.value })} placeholder="e.g. 2–3 hours" /></label><label>Description<textarea required rows="5" value={fields.details} onChange={(event) => setFields({ ...fields, details: event.target.value })} placeholder="What makes this service special?" /></label><button type="submit" className="button"><span>Add service</span><Icon name="arrowUp" size={18} /></button></form></div></DashboardLayout>;
}

export function ManagePage() {
  const [services, refresh] = useRemote('/serviceList', demoServices);
  const dispatch = useDispatch();
  const [error, setError] = useState('');
  async function remove(id) {
    if (!window.confirm('Remove this service?')) return;
    try { await api('/deleteClasses/' + id, { method: 'DELETE' }); const next = services.filter((item) => item._id !== id); dispatch(setServices(next)); refresh(); }
    catch (cause) { setError(cause.message); }
  }
  return <DashboardLayout eyebrow="ADMIN TOOLS" title={<>Manage <em>services.</em></>} description="Keep your service collection fresh and up to date."><Notice message={error} type="error" onClose={() => setError('')} /><div className="dashboard-section-head"><h2>Current services</h2><ButtonLink href="/addService">Add service</ButtonLink></div>{services.length ? <div className="admin-list">{services.map((service) => <article className="admin-row" key={service._id}><div className="row-icon"><Icon name="sparkle" size={22} /></div><div className="row-main"><strong>{service.serviceName}</strong><span>{service.category || 'Cleaning service'} · {service.duration || 'Flexible timing'}</span></div><strong className="row-price">{formatMoney(service.price)}</strong><button className="icon-button danger" type="button" aria-label={'Delete ' + service.serviceName} onClick={() => remove(service._id)}><Icon name="trash" size={19} /></button></article>)}</div> : <EmptyState title="No services yet" text="Add your first cleaning service to get started." href="/addService" action="Add service" />}</DashboardLayout>;
}

export function AddAdminPage() {
  const [email, setEmail] = useState('');
  const [admins, refresh] = useRemote('/admin');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    try { await api('/addAdmin', jsonOptions('POST', { email })); setNotice('Admin added.'); setEmail(''); setError(''); refresh(); }
    catch (cause) { setError(cause.message); }
  }
  return <DashboardLayout eyebrow="ADMIN TOOLS" title={<>Your <em>team.</em></>} description="Give a trusted teammate access to the admin workspace."><div className="form-card dashboard-form"><span className="eyebrow"><span className="eyebrow-dot" /> TEAM ACCESS</span><h2>Add an admin.</h2><Notice message={notice} onClose={() => setNotice('')} /><Notice message={error} type="error" onClose={() => setError('')} /><form onSubmit={submit} className="stack-form"><label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="teammate@example.com" /></label><button className="button" type="submit"><span>Add teammate</span><Icon name="arrowUp" size={18} /></button></form></div><div className="dashboard-section-head"><h2>Current admins</h2><span className="result-count">{admins.length} PEOPLE</span></div><div className="admin-list">{admins.map((admin) => <div className="admin-row" key={admin._id}><span className="avatar">{admin.email?.charAt(0).toUpperCase()}</span><div className="row-main"><strong>{admin.email}</strong><span>Administrator</span></div><StatusBadge status="Active" /></div>)}</div></DashboardLayout>;
}
