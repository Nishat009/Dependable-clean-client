import React from 'react';
import Link from 'next/link';
import Brand from './Brand';
import ButtonLink from './ButtonLink';

export default function Footer() {
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
