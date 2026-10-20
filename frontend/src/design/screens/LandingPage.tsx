import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Icon, { type IconName } from '../components/Icon';
import styles from '../landing.module.css';

// Product landing page for showcases. "Live demo" opens the real app; the demo accounts live on /login.
const demoUrl = '/';
const demoLoginUrl = '/login';

const features: { icon: IconName; title: string; text: string }[] = [
  { icon: 'calendar', title: 'Online booking', text: 'Customers pick a service, date and address. Bookings open three days ahead and only in areas the business covers.' },
  { icon: 'grid', title: 'Role-based dashboards', text: 'Owner, sub admin, staff and customer all sign in to one dashboard that only shows what their role allows.' },
  { icon: 'users', title: 'Team management', text: 'Add staff and sub admins, rename them, and switch access off or back on instantly.' },
  { icon: 'check', title: 'Job assignment & tracking', text: 'Confirm a booking, send a cleaner, and watch it move from started to finished with internal job notes.' },
  { icon: 'clock', title: 'Reschedule & cancel requests', text: 'Customers ask to move or cancel a booking; the owner approves or turns it down in one click.' },
  { icon: 'star', title: 'Review moderation', text: 'One review per finished job. Reviews go public only after the owner approves them.' },
  { icon: 'message', title: 'Support chat & tickets', text: 'Private customer chat with the business, plus support tickets the owner can hand to staff.' },
  { icon: 'list', title: 'Reports & activity log', text: 'Business reports and a log of every change, so the owner always knows who did what.' },
  { icon: 'pin', title: 'Services, prices & areas', text: 'The owner sets up services, prices, service areas, FAQ, offers and the cancellation policy.' },
];

const steps = ['Requested', 'Confirmed', 'Assigned', 'In progress', 'Completed'];

const roles: { icon: IconName; title: string; points: string[] }[] = [
  { icon: 'shield', title: 'Owner', points: ['Runs services, prices and areas', 'Confirms bookings and assigns staff', 'Manages team, reviews and reports'] },
  { icon: 'user', title: 'Sub admin', points: ['Everything the owner can do', 'Except adding or changing team members'] },
  { icon: 'home', title: 'Staff', points: ['Sees only their own jobs and schedule', 'Marks jobs started and finished', 'Answers tickets handed to them'] },
  { icon: 'sparkle', title: 'Customer', points: ['Books and tracks cleanings', 'Asks to reschedule or cancel', 'Leaves a review and chats with support'] },
];

const stack: { group: string; items: string[] }[] = [
  { group: 'Frontend', items: ['Next.js 16', 'React 19', 'TypeScript', 'Redux Toolkit'] },
  { group: 'Backend', items: ['Node.js', 'Express 5', 'MongoDB'] },
  { group: 'Platform', items: ['Role-based access control', 'REST API', 'Responsive UI', 'Vercel + Render'] },
];

function DemoButton({ label = 'Live demo' }: { label?: string }) {
  return <Link href={demoUrl} className={styles.primary}>{label}<Icon name="arrowUp" size={18} /></Link>;
}

export default function LandingPage() {
  return <div className={styles.page}>
    <Head>
      <title>Dependable Clean — Cleaning booking & business management platform</title>
      <meta name="description" content="A full-stack cleaning business platform: online booking, role-based dashboards for owner, staff and customers, job tracking, reviews and support. Built with Next.js, React, Express and MongoDB." />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:title" content="Dependable Clean — Cleaning booking & business management platform" />
      <meta property="og:description" content="Customers book, owners manage, staff deliver. One platform with a dashboard for every role." />
      <meta property="og:image" content="/landing/cover.png" />
    </Head>

    <header className={styles.nav}>
      <div className={styles.wrap + ' ' + styles.navInner}>
        <Link href="/landing" className={styles.brand} aria-label="Dependable Clean">
          <span className={styles.brandMark}><Icon name="sparkle" size={20} /></span>
          <span>dependable<span className={styles.dot}>.</span><small>clean</small></span>
        </Link>
        <nav className={styles.navLinks} aria-label="Sections">
          <a href="#features">Features</a>
          <a href="#roles">Roles</a>
          <a href="#stack">Tech stack</a>
        </nav>
        <DemoButton />
      </div>
    </header>

    <main>
      <section className={styles.hero}>
        <div className={styles.wrap + ' ' + styles.heroGrid}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}><span className={styles.eyebrowDot} />Cleaning business platform</span>
            <h1>Book, manage and deliver every clean <em>in one place.</em></h1>
            <p>Dependable Clean is a full-stack web app for a cleaning business. Customers book cleanings, the owner runs the business, and staff complete the jobs — each with a dashboard built for their role.</p>
            <div className={styles.actions}>
              <DemoButton label="Open live demo" />
              <Link href={demoLoginUrl} className={styles.secondary}>Try a demo account<Icon name="arrow" size={18} /></Link>
            </div>
            <ul className={styles.chips} aria-label="Built with">
              {['Next.js', 'React', 'TypeScript', 'Express', 'MongoDB'].map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className={styles.devices} aria-hidden="true">
            <div className={styles.laptop}>
              <div className={styles.laptopScreen}><img src="/landing/admin-dashboard.webp" alt="" width={1600} height={1000} /></div>
              <div className={styles.laptopBase} />
            </div>
            <div className={styles.phone}><img src="/landing/mobile-home.webp" alt="" width={600} height={1298} /></div>
          </div>
        </div>
      </section>

      <section className={styles.strip} aria-label="At a glance">
        <div className={styles.wrap + ' ' + styles.stripGrid}>
          <div><strong>4</strong><span>user roles</span></div>
          <div><strong>5</strong><span>step booking flow</span></div>
          <div><strong>1</strong><span>shared dashboard</span></div>
          <div><strong>100%</strong><span>mobile responsive</span></div>
        </div>
      </section>

      <section id="features" className={styles.section}>
        <div className={styles.wrap}>
          <span className={styles.eyebrowDark}><span className={styles.eyebrowDot} />Key features</span>
          <h2>Everything a cleaning business runs on.</h2>
          <div className={styles.featureGrid}>
            {features.map((feature) => <article key={feature.title} className={styles.feature}>
              <span className={styles.featureIcon}><Icon name={feature.icon} size={22} /></span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section className={styles.flowSection}>
        <div className={styles.wrap}>
          <span className={styles.eyebrow}><span className={styles.eyebrowDot} />How a booking moves</span>
          <h2>From request to a finished job.</h2>
          <ol className={styles.flow}>
            {steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}
          </ol>
          <p className={styles.flowNote}>A booking can be cancelled any time before the work starts. Customers can review once the job is completed.</p>
        </div>
      </section>

      <section id="roles" className={styles.section}>
        <div className={styles.wrap}>
          <span className={styles.eyebrowDark}><span className={styles.eyebrowDot} />Built for every role</span>
          <h2>Everyone sees only what they need.</h2>
          <div className={styles.roleGrid}>
            {roles.map((role) => <article key={role.title} className={styles.role}>
              <span className={styles.featureIcon}><Icon name={role.icon} size={22} /></span>
              <h3>{role.title}</h3>
              <ul>{role.points.map((point) => <li key={point}><Icon name="check" size={16} />{point}</li>)}</ul>
            </article>)}
          </div>
          <div className={styles.screens}>
            <figure><img src="/landing/home.webp" alt="Dependable Clean home page with service kits and booking" width={1600} height={1000} /><figcaption>Public website and booking</figcaption></figure>
            <figure className={styles.screenPhone}><img src="/landing/mobile-dashboard.webp" alt="Customer dashboard on a phone" width={600} height={1298} /><figcaption>Customer dashboard</figcaption></figure>
          </div>
        </div>
      </section>

      <section id="stack" className={styles.stackSection}>
        <div className={styles.wrap}>
          <span className={styles.eyebrow}><span className={styles.eyebrowDot} />Tech stack</span>
          <h2>Modern, full-stack JavaScript.</h2>
          <div className={styles.stackGrid}>
            {stack.map((group) => <div key={group.group} className={styles.stackGroup}>
              <h3>{group.group}</h3>
              <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>)}
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.wrap + ' ' + styles.ctaInner}>
          <h2>See it working.</h2>
          <p>Open the live app, or sign in with a demo Admin, Staff or Customer account to explore each dashboard.</p>
          <div className={styles.actions}>
            <DemoButton />
            <Link href={demoLoginUrl} className={styles.secondary}>Demo accounts<Icon name="arrow" size={18} /></Link>
          </div>
        </div>
      </section>
    </main>

    <footer className={styles.footer}>
      <div className={styles.wrap}>© {new Date().getFullYear()} Dependable Clean · Cleaning booking & business management platform</div>
    </footer>
  </div>;
}
