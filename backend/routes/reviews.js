const v = require('../validation');
const { normalizeStatus } = require('../permissions');

// Reviews. A customer reviews each of their completed bookings once; an admin approves it before it shows publicly.
module.exports = (app, { reviews, bookings, guards: { requireCustomer, requireSuperAdmin, requireAdmin }, audit, asyncRoute, fail, parseId }) => {
  // Reviews saved before moderation existed have no status and count as approved.
  const reviewStatus = (review) => review.status || 'Approved';
  const withStatus = (review) => ({ ...review, status: reviewStatus(review) });

  app.post('/addReview', requireCustomer, asyncRoute(async (req, res) => {
    const orderId = parseId(req.body.orderId);
    if (!orderId) return fail(res, 400, 'Please choose one of your orders.');
    const order = await bookings.findOne({ _id: orderId, email: req.user.email });
    if (!order) return fail(res, 403, 'That order does not belong to your account.');
    if (normalizeStatus(order.status) !== 'completed') return fail(res, 403, 'Only your completed bookings can be reviewed.');
    if (await reviews.findOne({ orderId: String(orderId) })) return fail(res, 409, 'You have already reviewed this order.');
    const comments = v.text(req.body.comments, 1000);
    const rating = Math.round(Number(req.body.rating));
    if (comments.length < 10) return fail(res, 400, 'Please write at least 10 characters.');
    if (!(rating >= 1 && rating <= 5)) return fail(res, 400, 'Please choose a rating from 1 to 5.');
    const review = { name: req.user.name, email: req.user.email, orderId: String(orderId), orderName: order.serviceName, rating, comments, status: 'Pending', createdAt: new Date().toISOString() };
    try {
      await reviews.insertOne(review);
    } catch (error) {
      if (error.code === 11000) return fail(res, 409, 'This booking already has a review.');
      throw error;
    }
    res.json(review);
  }));

  app.get('/reviews', asyncRoute(async (_req, res) => {
    const approved = (await reviews.find({}).toArray()).filter((review) => reviewStatus(review) === 'Approved').sort(v.newestFirst);
    res.json(approved.map((review) => ({ _id: review._id, name: review.name, rating: review.rating, comments: review.comments, status: 'Approved' })));
  }));
  app.get('/myReviews', requireCustomer, asyncRoute(async (req, res) => res.json((await reviews.find({ email: req.user.email }).toArray()).sort(v.newestFirst).map(withStatus))));
  // The customer's completed orders, newest first, each marked when it already has a review.
  app.get('/reviewOrders', requireCustomer, asyncRoute(async (req, res) => {
    const reviewed = new Set((await reviews.find({ email: req.user.email }).toArray()).map((review) => review.orderId));
    const orders = (await bookings.find({ email: req.user.email }).toArray()).filter((order) => normalizeStatus(order.status) === 'completed');
    res.json(orders.sort(v.newestFirst).map((order) => ({ ...order, reviewed: reviewed.has(String(order._id)) })));
  }));
  app.get('/teamReviews', requireSuperAdmin, asyncRoute(async (_req, res) => res.json((await reviews.find({}).toArray()).sort(v.newestFirst).map(({ email, ...review }) => withStatus(review)))));
  app.get('/reviewList', requireAdmin, asyncRoute(async (_req, res) => res.json((await reviews.find({}).toArray()).sort(v.newestFirst).map(withStatus))));

  app.patch('/updateReview/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid review id.');
    const status = String(req.body.status || '');
    if (!v.reviewStatuses.includes(status)) return fail(res, 400, 'Choose Pending, Approved or Rejected.');
    if (!(await reviews.updateOne({ _id: id }, { $set: { status } })).matchedCount) return fail(res, 404, 'Review not found.');
    await audit(req, 'review ' + status, id);
    res.json(true);
  }));
  app.delete('/deleteReview/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid review id.');
    if (!(await reviews.deleteOne({ _id: id })).deletedCount) return fail(res, 404, 'Review not found.');
    await audit(req, 'review deleted', id);
    res.json(true);
  }));
};
