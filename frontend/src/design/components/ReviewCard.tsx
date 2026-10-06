import React from 'react';
import { formatDate } from '../data';
import type { Review } from '../types';
import Icon from './Icon';
import Stars from './Stars';

export default function ReviewCard({ review }: { review: Review }) {
  return <article className="review-card">
    <div className="review-card-top"><Icon name="sparkle" size={24} /><Stars rating={review.rating} /></div>
    <blockquote>“{review.comments}”</blockquote>
    <div className="review-person">
      <span className="avatar">{(review.name || 'G').charAt(0).toUpperCase()}</span>
      <span>
        <strong>{review.name || 'Happy customer'}</strong>
        <small>{review.orderName ? review.orderName + (review.createdAt ? ' · ' + formatDate(review.createdAt) : '') : review.demo ? 'Local preview review' : 'Dependable Clean client'}</small>
      </span>
    </div>
  </article>;
}
