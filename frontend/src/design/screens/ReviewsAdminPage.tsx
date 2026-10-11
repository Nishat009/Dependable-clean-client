import React, { useState } from 'react';
import { api, errorMessage, jsonOptions } from '../api';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import SearchField from '../components/SearchField';
import Stars from '../components/Stars';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../data';
import { useRemote } from '../hooks/useRemote';
import { useAuth } from '../Auth';
import Pagination from '../components/Pagination';
import { isManager, reviewStatuses, type Review, type ReviewStatus } from '../types';

type Filter = ReviewStatus | 'All';
const filters: Filter[] = ['Pending', 'Approved', 'Rejected', 'Hidden', 'All'];

// Customers' reviews wait here as Pending. Approved reviews appear on the home page.
export default function ReviewsAdminPage() {
  const { user } = useAuth();
  const { data: reviews, loading, error: loadError, refresh } = useRemote<Review[]>(user?.role === 'staff' ? '/teamReviews' : '/reviewList', []);
  const isSuperAdmin = isManager(user?.role);
  const [filter, setFilter] = useState<Filter>('Pending');
  const [search,setSearch] = useState('');
  const [page,setPage] = useState(1);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Review | null>(null);
  const visible = reviews.filter(r => (filter === 'All' || r.status === filter) && [r.name,r.comments,r.email].join(' ').toLowerCase().includes(search.toLowerCase()));
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
    <Notice message={error || loadError} type="error" onClose={() => setError('')} />
    <div className="segmented" role="group" aria-label="Filter reviews">
      {filters.map((item) => <button key={item} type="button" aria-pressed={filter === item} className={filter === item ? 'active' : ''} onClick={() => {setFilter(item);setPage(1);}}>{item} <span>{count(item)}</span></button>)}
    </div>
<SearchField className="list-search" ariaLabel="Search reviews" placeholder="Search by name, email or review" value={search} onChange={value=>{setSearch(value);setPage(1);}} />
    {loading && <p>Loading reviews...</p>}
    {visible.length ? <div className="admin-list">{visible.slice((page-1)*10,page*10).map((review) => <article className="admin-row review-row" key={review._id}>
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
          {status === 'Approved' ? 'Approve' : status === 'Hidden' ? 'Hide' : 'Reject'}
        </button>)}
        <button className="icon-button danger" type="button" aria-label="Delete review" title="Delete" onClick={() => setPendingDelete(review)}><Icon name="trash" size={18} /></button>
      </div>}
    </article>)}</div> : !loading && <EmptyState title={filter === 'Pending' ? 'All caught up' : 'Nothing here yet'} text={filter === 'Pending' ? 'New reviews from customers will wait here for you.' : 'Reviews with this status will show up here.'} />}
    <Pagination page={page} pageSize={10} total={visible.length} noun="reviews" onChange={setPage} />
    {pendingDelete && <ConfirmModal title="Delete this review?" confirmLabel="Delete review" onCancel={() => setPendingDelete(null)} onConfirm={() => remove(pendingDelete)}>
      The review from <strong>{pendingDelete.name}</strong> will be deleted for good{pendingDelete.status === 'Approved' ? ' and taken off the home page' : ''}.
    </ConfirmModal>}
  </>;
}
