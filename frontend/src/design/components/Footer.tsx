import React from 'react';
import Link from 'next/link';
import { useRemote } from '../hooks/useRemote';
import Brand from './Brand';
import ButtonLink from './ButtonLink';

export default function Footer() {
  const { data: business } = useRemote<{ email: string; phone: string; faq: string; cancellationPolicy: string; offers: string }>('/business', { email: '', phone: '', faq: '', cancellationPolicy: '', offers: '' });
  return <footer className="site-footer" id="contact">
    <div className="wrap footer-top" data-reveal>
      <div>
        <span className="eyebrow"><span className="eyebrow-dot" /> A fresh start is one click away</span>
        <h2>Come home<br />to <em>better.</em></h2>
      </div>
      <ButtonLink href="/book">Find your clean</ButtonLink>
    </div>
    <div className="wrap" style={{whiteSpace: "pre-wrap"}}>{business.email && <p>Email: {business.email}</p>}{business.phone && <p>Phone: {business.phone}</p>}{business.faq && <details><summary>Frequently asked questions</summary><p>{business.faq}</p></details>}{business.cancellationPolicy && <details><summary>Cancellation policy</summary><p>{business.cancellationPolicy}</p></details>}{typeof business.offers === "string" && business.offers && <details><summary>Current offers</summary><p>{business.offers}</p></details>}</div>
    <div className="wrap footer-bottom">
      <div><Brand compact /><p>Thoughtful cleaning for spaces worth living in.</p></div>
      <div className="footer-links">
        <Link href="/home#services">Services</Link><Link href="/home#about">About</Link><Link href="/home#process">Our process</Link><Link href="/login">Sign in</Link>
      </div>
      <span className="footer-copy">© {new Date().getFullYear()} Dependable Clean</span>
    </div>
    <div className="footer-wordmark" data-reveal="wordmark" aria-hidden="true"><span>dependable<i>.</i></span></div>
  </footer>;
}
