import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon from './Icons';
import { useAuth } from './Auth';
import { formatMoney } from './data';
import Product, { productFor } from './Products';

export function Brand({ compact = false }) {
  return <Link href="/" className={'brand' + (compact ? ' brand-compact' : '')} aria-label="Dependable Clean home">
    <span className="brand-mark"><Icon name="sparkle" size={22} /></span>
    <span>dependable<span className="brand-accent">.</span><small>clean</small></span>
  </Link>;
}

export function ButtonLink({ href, children, outline = false, className = '' }) {
  return <Link href={href} className={'button ' + (outline ? 'button-outline ' : '') + className}>
    <span>{children}</span><Icon name="arrowUp" size={18} />
  </Link>;
}

export function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 20);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  useEffect(() => setOpen(false), [router.asPath]);
  const current = router.asPath.split(/[?#]/)[0];
  // Only the home hero is dark enough for a transparent header; every other page gets a solid bar.
  const solid = current !== '/';

  return <header className={'site-header' + (solid ? ' site-header-solid' : '') + (scrolled ? ' is-scrolled' : '')}>
    <div className="site-header-inner wrap">
      <Brand />
      <nav className={'main-nav' + (open ? ' is-open' : '')} aria-label="Main navigation">
        <Link href="/" className={current === '/' ? 'active' : ''}>Home</Link>
        <Link href="/#services" className={current.startsWith('/book') ? 'active' : ''}>Services</Link>
        <Link href="/#about">About us</Link>
        <Link href="/#process">Our process</Link>
        <Link href="/#contact">Contact</Link>
        {user ? <Link href="/dashboard" className="mobile-dashboard-link">Dashboard</Link> : <Link href="/login" className="mobile-dashboard-link">Sign in</Link>}
      </nav>
      <div className="header-actions">
        {user ? <Link href="/dashboard" className="header-login"><Icon name="grid" size={17} /> Dashboard</Link>
          : <Link href="/login" className="header-login">Sign in</Link>}
        <ButtonLink href="/book" className="header-book">Book a clean</ButtonLink>
        <button className="menu-toggle" type="button" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
          <Icon name={open ? 'close' : 'menu'} size={23} />
        </button>
      </div>
    </div>
  </header>;
}

export function Footer() {
  return <footer className="site-footer" id="contact">
    <div className="wrap footer-top" data-reveal>
      <div>
        <span className="eyebrow"><span className="eyebrow-dot" /> A fresh start is one click away</span>
        <h2>Come home<br />to <em>better.</em></h2>
      </div>
      <ButtonLink href="/book">Find your clean</ButtonLink>
    </div>
    <div className="wrap footer-bottom">
      <div><Brand compact /><p>Thoughtful cleaning for spaces worth living in.</p></div>
      <div className="footer-links">
        <Link href="/#services">Services</Link><Link href="/#about">About</Link><Link href="/#process">Our process</Link><Link href="/login">Sign in</Link>
      </div>
      <span className="footer-copy">© {new Date().getFullYear()} Dependable Clean</span>
    </div>
    <div className="footer-wordmark" data-reveal="wordmark" aria-hidden="true"><span>dependable<i>.</i></span></div>
  </footer>;
}

export function SectionIntro({ label, title, description, dark = false }) {
  return <div className={'section-intro' + (dark ? ' section-intro-dark' : '')}>
    <span className="eyebrow"><span className="eyebrow-dot" />{label}</span>
    <h2>{title}</h2>
    {description && <p>{description}</p>}
  </div>;
}

export function ServiceCard({ service, index = 0, total = 6 }) {
  const pad = (value) => String(value).padStart(2, '0');
  return <Link href={'/book/' + service._id} className="service-card">
    <div className="service-card-top"><span className="service-index">{pad(index + 1)} / {pad(total)}</span><span className="service-card-arrow"><Icon name="arrowUp" size={20} /></span></div>
    <div className="service-visual" aria-hidden="true">
      <span className="service-visual-orbit orbit-one" /><span className="service-visual-orbit orbit-two" />
      <Product type={productFor(service, index)} className="service-product" />
      <span className="service-bubble bubble-one" /><span className="service-bubble bubble-two" />
    </div>
    <div className="service-card-content">
      <span className="service-category">{service.category || 'Cleaning service'}</span>
      <h3>{service.serviceName}</h3>
      <p>{service.details}</p>
      <div className="service-card-meta"><span>{service.duration || 'Flexible timing'}</span><strong>From {formatMoney(service.price)}</strong></div>
    </div>
  </Link>;
}

export function StatusBadge({ status }) {
  const value = status || 'Pending';
  const kind = value.toLowerCase().replace(/\s+/g, '-');
  return <span className={'status-badge status-' + kind}><span />{value}</span>;
}

export function Notice({ message, type = 'success', onClose }) {
  if (!message) return null;
  return <div className={'notice notice-' + type} role="status">
    <Icon name={type === 'success' ? 'check' : 'close'} size={18} />
    <span>{message}</span>
    {onClose && <button type="button" onClick={onClose} aria-label="Dismiss message"><Icon name="close" size={16} /></button>}
  </div>;
}

export function EmptyState({ title, text, href, action }) {
  return <div className="empty-state">
    <div className="empty-symbol"><Icon name="sparkle" size={30} /></div>
    <h3>{title}</h3><p>{text}</p>
    {href && <ButtonLink href={href}>{action || 'Explore services'}</ButtonLink>}
  </div>;
}

export function DashboardLayout({ title, eyebrow = 'Your space', description, children }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';
  const links = [
    { href: '/dashboard', label: 'Overview', icon: 'grid' },
    { href: '/book', label: 'Explore services', icon: 'sparkle' },
    { href: '/bookList', label: 'My bookings', icon: 'calendar' },
    { href: '/addReview', label: 'Write a review', icon: 'star' },
  ];
  const adminLinks = [
    { href: '/orderList', label: 'Orders', icon: 'list' },
    { href: '/addService', label: 'Add service', icon: 'plus' },
    { href: '/addManage', label: 'Manage services', icon: 'grid' },
    { href: '/addAdmin', label: 'Add admin', icon: 'user' },
  ];

  return <div className="dashboard-page">
    <Header />
    <div className="dashboard-grid wrap">
      <aside className="dashboard-sidebar">
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Dashboard navigation">
          {links.map((link) => <Link key={link.href} href={link.href} className={'side-link' + (router.asPath.split('?')[0] === link.href ? ' active' : '')}>
            <Icon name={link.icon} size={19} /><span>{link.label}</span>
          </Link>)}
          {isAdmin && <><div className="sidebar-divider" /><div className="sidebar-label">ADMIN TOOLS</div>
            {adminLinks.map((link) => <Link key={link.href} href={link.href} className={'side-link' + (router.asPath.split('?')[0] === link.href ? ' active' : '')}>
              <Icon name={link.icon} size={19} /><span>{link.label}</span>
            </Link>)}</>}
        </nav>
        <div className="sidebar-profile">
          <div className="avatar">{(user?.name || 'G').charAt(0)}</div>
          <div><strong>{user?.name || 'Guest'}</strong><small>{isAdmin ? 'Administrator' : 'Member'}</small></div>
          <button type="button" aria-label="Sign out" title="Sign out" onClick={() => signOut().then(() => router.push('/'))}><Icon name="logout" size={18} /></button>
        </div>
      </aside>
      <main className="dashboard-main" key={router.asPath.split('?')[0]}>
        {user?.demo && <div className="demo-banner"><Icon name="sparkle" size={16} /> Demo account · Anyone can use it, so please keep it to test data</div>}
        <div className="dashboard-heading"><span className="eyebrow"><span className="eyebrow-dot" />{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
        {children}
      </main>
    </div>
  </div>;
}
