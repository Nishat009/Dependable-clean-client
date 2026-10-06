import React, { useState, type FormEvent } from 'react';
import { api, errorMessage, jsonOptions } from '../api';
import { useAuth } from '../Auth';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import Stars from '../components/Stars';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../data';
import { useRemote } from '../hooks/useRemote';
import type { Review, ReviewStatus } from '../types';

const statusNote: Record<ReviewStatus, string> = {
  Pending: 'Waiting for our team to approve it',
  Approved: 'Showing on the home page',
  Rejected: 'Not shown on the site',
};

export default function ReviewPage() {
  const { user } = useAuth();
  const { data: mine, refresh } = useRemote<Review[]>(user ? '/myReviews' : null, []);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      await api('/addReview', jsonOptions('POST', { rating, comments }));
      setComments('');
      setNotice('Thank you! Your review is pending and will appear on the home page once our team approves it.');
      refresh();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }

  return <>
    <PageHeading title={<>Tell us how it <em>felt.</em></>} description="Your words help us make every fresh start a little better." />
    <div className="form-card dashboard-form">
      <span className="eyebrow"><span className="eyebrow-dot" /> SHARE YOUR EXPERIENCE</span>
      <h2>A note from you.</h2>
      <Notice message={notice} onClose={() => setNotice('')} />
      <Notice message={error} type="error" onClose={() => setError('')} />
      <form onSubmit={submit} className="stack-form">
        <div className="field">
          <span className="field-label" id="rating-label">Your rating</span>
          <div className="star-picker" role="group" aria-labelledby="rating-label">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={value + ' stars'} aria-pressed={rating === value} className={value <= rating ? 'selected' : ''} onClick={() => setRating(value)}>★</button>)}</div>
        </div>
        <label>Your review<textarea required minLength={10} maxLength={1000} rows={6} value={comments} onChange={(event) => setComments(event.target.value)} placeholder="What did you love about your clean?" /></label>
        <button className="button" type="submit" disabled={busy}><span>{busy ? 'Sending…' : 'Share review'}</span><Icon name="arrowUp" size={18} /></button>
      </form>
    </div>
    {mine.length > 0 && <>
      <div className="dashboard-section-head"><h2>Your reviews</h2><span className="result-count">{mine.length} SENT</span></div>
      <div className="admin-list">{mine.map((review) => <article className="admin-row review-row" key={review._id}>
        <div className="row-icon"><Icon name="message" size={22} /></div>
        <div className="row-main"><Stars rating={review.rating} /><strong>“{review.comments}”</strong><span>{formatDate(review.createdAt)} · {statusNote[review.status]}</span></div>
        <StatusBadge status={review.status} />
      </article>)}</div>
    </>}
  </>;
}
