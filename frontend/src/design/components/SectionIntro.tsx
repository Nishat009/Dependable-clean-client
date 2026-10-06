import React, { type ReactNode } from 'react';

interface SectionIntroProps {
  label: string;
  title: ReactNode;
  description?: string;
  dark?: boolean;
}

export default function SectionIntro({ label, title, description, dark = false }: SectionIntroProps) {
  return <div className={'section-intro' + (dark ? ' section-intro-dark' : '')}>
    <span className="eyebrow"><span className="eyebrow-dot" />{label}</span>
    <h2>{title}</h2>
    {description && <p>{description}</p>}
  </div>;
}
