import React, { useState } from 'react';
import { api, errorMessage, jsonOptions } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import Stars from '../components/Stars';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../data';
import { useRemote } from '../hooks/useRemote';
import { useAuth } from '../Auth';
import { reviewStatuses, type Review, type ReviewStatus } from '../types';

type Filter = ReviewStatus | 'All';
const filters: Filter[] = ['Pending', 'Approved', 'Rejected', 'All'];

// Customers' reviews wait here as Pending. Approved reviews appear on the home page.
export default function ReviewsAdminPage() {
  const { user } = useAuth();
  const { data: reviews, loading, refresh } = useRemote<Review[]>(user?.role === 'staff' ? '/teamReviews' : '/reviewList', []);
  const isSuperAdmin = user?.role === 'superAdmin' || user?.role === 'admin';
  const [filter, setFilter] = useState<Filter>('Pending');
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Review | null>(null);
  const visible = filter === 'All' ? reviews : reviews.filter((review) => review.status === filter);
  const count = (status: Filter) => status === 'All' ? reviews.length : reviews.filter((review) => review.status === status).length;

  async function act(action: () => Promise<unknown>) {
    setError('');
    try { await action(); refresh(); } catch (cause) { setError(errorMessage(cause)); }
  }
  const setStatus = (review: Review, status: ReviewStatus) => act(() => api('/updateReview/' + review._id, jsonOptions('PATCH', { status })));
  async function remove(review: Review) {
    await api('/deleteReview/' + review._id, jsonOptions('DELETE'));
    setPendingDelete(null);
    refresh();
  }

  return <>
    <PageHeading eyebrow={isSuperAdmin ? 'ADMIN TOOLS' : 'STAFF VIEW'} title={<>Customer <em>reviews.</em></>} description={isSuperAdmin ? 'Approve a review to show it on the home page. Pending and rejected reviews stay hidden.' : 'See who has written a review and where it stands. Only the super admin can approve or reject reviews.'} />
    <Notice message={error} type="error" onClose={() => setError('')} />
    <div className="segmented" role="group" aria-label="Filter reviews">
      {filters.map((item) => <button key={item} type="button" aria-pressed={filter === item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item} <span>{count(item)}</span></button>)}
    </div>
    {visible.length ? <div className="admin-list">{visible.map((review) => <article className="admin-row review-row" key={review._id}>
      <span className="avatar">{(review.name || 'G').charAt(0).toUpperCase()}</span>
      <div className="row-main">
        <Stars rating={review.rating} />
        <strong>“{review.comments}”</strong>
        <span><b>{review.name}</b>{review.email ? ' · ' + review.email : ''} · {formatDate(review.createdAt)}</span>
        {review.orderName && <small className="review-order"><Icon name="calendar" size={13} /> Order: {review.orderName}</small>}
      </div>
      <StatusBadge status={review.status} />
      {isSuperAdmin && <div className="row-actions">
        {reviewStatuses.filter((status) => status !== review.status && status !== 'Pending').map((status) => <button key={status} type="button" className={'small-button' + (status === 'Approved' ? ' small-button-primary' : '')} onClick={() => setStatus(review, status)}>
          {status === 'Approved' ? 'Approve' : 'Reject'}
        </button>)}
        <button className="icon-button danger" type="button" aria-label="Delete review" title="Delete" onClick={() => setPendingDelete(review)}><Icon name="trash" size={18} /></button>
      </div>}
    </article>)}</div> : !loading && <EmptyState title={filter === 'Pending' ? 'All caught up' : 'Nothing here yet'} text={filter === 'Pending' ? 'New reviews from customers will wait here for you.' : 'Reviews with this status will show up here.'} />}
    {pendingDelete && <ConfirmModal title="Delete this review?" confirmLabel="Delete review" onCancel={() => setPendingDelete(null)} onConfirm={() => remove(pendingDelete)}>
      The review from <strong>{pendingDelete.name}</strong> will be deleted for good{pendingDelete.status === 'Approved' ? ' and taken off the home page' : ''}.
    </ConfirmModal>}
  </>;
}
