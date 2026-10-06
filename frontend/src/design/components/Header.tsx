import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../Auth';
import Brand from './Brand';
import ButtonLink from './ButtonLink';
import Icon from './Icon';

// Rendered once by the app shell, so it stays in place while pages change.
export default function Header() {
  const { user } = useAuth();
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
