import React from 'react';

// Read-only star rating, out of five.
export default function Stars({ rating = 5 }: { rating?: number }) {
  const value = Math.max(0, Math.min(5, Math.round(rating)));
  return <span className="stars" role="img" aria-label={value + ' out of 5 stars'}>
    {[1, 2, 3, 4, 5].map((star) => <i key={star} className={star <= value ? 'on' : ''} aria-hidden="true">★</i>)}
  </span>;
}
