import React from 'react';
import ButtonLink from './ButtonLink';
import Icon from './Icon';

interface EmptyStateProps {
  title: string;
  text: string;
  href?: string;
  action?: string;
}

export default function EmptyState({ title, text, href, action }: EmptyStateProps) {
  return <div className="empty-state">
    <div className="empty-symbol"><Icon name="sparkle" size={30} /></div>
    <h3>{title}</h3><p>{text}</p>
    {href && <ButtonLink href={href}>{action || 'Explore services'}</ButtonLink>}
  </div>;
}
