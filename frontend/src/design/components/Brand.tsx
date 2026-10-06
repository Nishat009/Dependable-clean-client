import React from 'react';
import Link from 'next/link';
import Icon from './Icon';

export default function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className={'brand' + (compact ? ' brand-compact' : '')} aria-label="Dependable Clean home">
    <span className="brand-mark"><Icon name="sparkle" size={22} /></span>
    <span>dependable<span className="brand-accent">.</span><small>clean</small></span>
  </Link>;
}
