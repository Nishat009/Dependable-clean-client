import React from 'react';
import type { Review } from '../types';
import Icon from './Icon';
import Stars from './Stars';

export default function ReviewCard({ review }: { review: Review }) {
  return <article className="review-card">
    <div className="review-card-top"><Icon name="sparkle" size={24} /><Stars rating={review.rating} /></div>
    <blockquote>“{review.comments}”</blockquote>
    <div className="review-person">
      <span className="avatar">{(review.name || 'G').charAt(0)}</span>
      <span><strong>{review.name || 'Happy customer'}</strong><small>{review.demo ? 'Local preview review' : 'Dependable Clean client'}</small></span>
    </div>
  </article>;
}
