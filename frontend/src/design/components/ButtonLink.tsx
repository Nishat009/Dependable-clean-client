import React, { type ReactNode } from 'react';
import Link from 'next/link';
import Icon from './Icon';

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  outline?: boolean;
  className?: string;
}

export default function ButtonLink({ href, children, outline = false, className = '' }: ButtonLinkProps) {
  return <Link href={href} className={'button ' + (outline ? 'button-outline ' : '') + className}>
    <span>{children}</span><Icon name="arrowUp" size={18} />
  </Link>;
}
