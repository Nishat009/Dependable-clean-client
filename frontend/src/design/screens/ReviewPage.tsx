import React, { useState, type FormEvent } from 'react';
import { api, errorMessage, jsonOptions } from '../api';
import { useAuth } from '../Auth';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import Select from '../components/Select';
import Stars from '../components/Stars';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../data';
import { useRemote } from '../hooks/useRemote';
import type { Booking, Review, ReviewStatus } from '../types';

const statusNote: Record<ReviewStatus, string> = {
  Pending: 'Waiting for our team to approve it',
  Approved: 'Showing on the home page',
  Rejected: 'Not shown on the site',
};
const ratingWords = ['', 'Not great', 'Could be better', 'Good', 'Really good', 'Loved it'];
const MAX_LENGTH = 1000;

function StarPicker({ value, onChange }: { value: number; onChange(value: number): void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return <div className="field">
    <span className="field-label" id="rating-label">Your rating</span>
    <div className="star-picker-row">
      <div className="star-picker" role="radiogroup" aria-labelledby="rating-label" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" role="radio" aria-checked={value === star} aria-label={star + (star === 1 ? ' star' : ' stars')}
          className={star <= shown ? 'selected' : ''} onMouseEnter={() => setHover(star)} onClick={() => onChange(star)}>★</button>)}
      </div>
      <span className="star-picker-word">{ratingWords[shown]}</span>
    </div>
  </div>;
}

// Customers review one of their own orders. The review waits as Pending until the super admin approves it.
export default function ReviewPage() {
  const { user } = useAuth();
  const { data: mine, refresh } = useRemote<Review[]>(user ? '/myReviews' : null, []);
  const { data: orders, loading, refresh: refreshOrders } = useRemote<Booking[]>(user ? '/reviewOrders' : null, []);
  const [orderId, setOrderId] = useState('');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const open = orders.filter((order) => !order.reviewed);
  const orderOptions = orders.map((order) => ({
    value: order._id,
    label: order.serviceName,
    hint: order.reviewed ? 'Already reviewed' : formatDate(order.date) + ' · ' + order.status,
    disabled: order.reviewed,
  }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      await api('/addReview', jsonOptions('POST', { rating, comments, orderId }));
      setComments(''); setOrderId(''); setRating(5);
      setNotice('Thank you! Your review is pending and will appear on the home page once our team approves it.');
      refresh(); refreshOrders();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }

  return <>
    <PageHeading title={<>Tell us how it <em>felt.</em></>} description="Your words help us make every fresh start a little better." />
    <Notice message={notice} onClose={() => setNotice('')} />
    {!loading && !orders.length
      ? <EmptyState title="Book a clean first" text="Reviews are for orders you have placed. Once you book a service, you can tell us how it went." href="/book" action="Explore services" />
      : <div className="form-card dashboard-form review-form-card">
        <span className="eyebrow"><span className="eyebrow-dot" /> SHARE YOUR EXPERIENCE</span>
        <h2>A note from you.</h2>
        <Notice message={error} type="error" onClose={() => setError('')} />
        {!loading && !open.length
          ? <p className="review-all-done"><Icon name="check" size={18} /> You have reviewed all {orders.length} of your orders. Thank you!</p>
          : <form onSubmit={submit} className="stack-form">
            <Select label="Which order is this review for?" required placeholder={loading ? 'Loading your orders…' : `Choose one of your ${orders.length} orders`}
              value={orderId} options={orderOptions} onChange={setOrderId} />
            <StarPicker value={rating} onChange={setRating} />
            <label>Your review
              <textarea required minLength={10} maxLength={MAX_LENGTH} rows={5} value={comments} onChange={(event) => setComments(event.target.value)} placeholder="What did you love about your clean?" />
              <small className="field-hint field-count">{comments.trim().length < 10 ? `At least 10 characters · ${comments.length}/${MAX_LENGTH}` : `${comments.length}/${MAX_LENGTH}`}</small>
            </label>
            <button className="button" type="submit" disabled={busy}><span>{busy ? 'Sending…' : 'Share review'}</span><Icon name="arrowUp" size={18} /></button>
          </form>}
      </div>}
    {mine.length > 0 && <>
      <div className="dashboard-section-head"><h2>Your reviews</h2><span className="result-count">{mine.length} SENT</span></div>
      <div className="my-reviews">{mine.map((review) => <article className="my-review" key={review._id}>
        <div className="my-review-top">
          <div><strong>{review.orderName || 'Cleaning service'}</strong><small>{formatDate(review.createdAt)}</small></div>
          <StatusBadge status={review.status} />
        </div>
        <Stars rating={review.rating} />
        <p>“{review.comments}”</p>
        <small className="my-review-note">{statusNote[review.status]}</small>
      </article>)}</div>
    </>}
  </>;
}
