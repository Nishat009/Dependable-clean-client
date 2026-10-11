import React from 'react';
import Icon from './Icon';

interface PaginationProps {
  page: number;
  pageSize: number;
  /** How many items there are across every page. */
  total: number;
  onChange(page: number): void;
  /** What is being counted, for the "Showing 1–10 of 24 bookings" line. */
  noun?: string;
  className?: string;
}

// Page numbers to show: always the first and last, the current page and its neighbours, with gaps as "…".
function pageList(page: number, pages: number): (number | 'gap')[] {
  const wanted = [...new Set([1, page - 1, page, page + 1, pages])].filter((item) => item >= 1 && item <= pages).sort((a, b) => a - b);
  return wanted.flatMap((item, index) => {
    const previous = wanted[index - 1];
    if (previous === undefined || item - previous === 1) return [item];
    // A gap of exactly one page shows that page rather than "…".
    return item - previous === 2 ? [item - 1, item] : ['gap' as const, item];
  });
}

// The page switcher under every admin list. It always shows the count, and the buttons only when there is more than one page.
export default function Pagination({ page, pageSize, total, onChange, noun = 'results', className = '' }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  if (!total) return null;
  const first = (current - 1) * pageSize + 1;
  return <nav className={'pagination' + (className ? ' ' + className : '')} aria-label="Pages">
    <span className="pagination-count">Showing <strong>{first}–{Math.min(current * pageSize, total)}</strong> of <strong>{total}</strong> {noun}</span>
    {pages > 1 && <div className="pagination-pages">
      <button type="button" className="pagination-step" aria-label="Previous page" disabled={current === 1} onClick={() => onChange(current - 1)}>
        <Icon name="chevron" size={16} className="pagination-back" />
      </button>
      {pageList(current, pages).map((item, index) => item === 'gap'
        ? <span key={'gap' + index} className="pagination-gap" aria-hidden="true">…</span>
        : <button key={item} type="button" className={'pagination-page' + (item === current ? ' is-current' : '')} aria-label={'Page ' + item}
          aria-current={item === current ? 'page' : undefined} onClick={() => item !== current && onChange(item)}>{item}</button>)}
      <button type="button" className="pagination-step" aria-label="Next page" disabled={current === pages} onClick={() => onChange(current + 1)}>
        <Icon name="chevron" size={16} />
      </button>
    </div>}
  </nav>;
}
