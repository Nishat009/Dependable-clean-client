import React, { type ReactNode } from 'react';

interface PageHeadingProps {
  title: ReactNode;
  eyebrow?: string;
  description?: string;
}

// The heading at the top of every dashboard screen.
export default function PageHeading({ title, eyebrow = 'Your space', description }: PageHeadingProps) {
  return <div className="dashboard-heading">
    <span className="eyebrow"><span className="eyebrow-dot" />{eyebrow}</span>
    <h1>{title}</h1>
    {description && <p>{description}</p>}
  </div>;
}
