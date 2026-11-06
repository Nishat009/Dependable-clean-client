const v = require('../validation');
const { can, normalizeStatus, transitions } = require('../permissions');

// Bookings. Every read and write is scoped: admins see all bookings, staff only the jobs assigned to them,
// customers only their own. The scope is part of the MongoDB filter, not a check after the read.
module.exports = (app, { bookings, services, users, guards: { requireUser, requireStaff, requireCustomer }, readDhakaThanas, activeLocations, teamRole, audit, asyncRoute, fail, parseId }) => {
  const scope = (req) => can(req.role, 'manage') ? {} : req.role === 'staff' ? { staffEmail: req.user.email } : { email: req.user.email };
  const safeBooking = (row, role) => {
    const result = { ...row, status: normalizeStatus(row.status) };
    if (role === 'customer') delete result.internalNotes;
    return result;
  };
  const visibleBookings = async (req) => (await bookings.find(scope(req)).toArray()).sort(v.newestFirst).map((row) => safeBooking(row, req.role));
  const ended = (status) => ['completed', 'cancelled', 'in_progress'].includes(normalizeStatus(status));

  app.post('/addAllBook', requireCustomer, asyncRoute(async (req, res) => {
    const id = parseId(req.body.serviceId);
    const service = id && await services.findOne({ _id: id });
    if (!service || service.active === false) return fail(res, 400, 'Please choose an active service to book.');
    const date = v.text(req.body.date, 10);
    if (!v.isIsoDate(date)) return fail(res, 400, 'Please choose a date for your clean.');
    if (date < v.earliestBookingDate()) return fail(res, 400, `Please choose a date at least ${v.BOOKING_LEAD_DAYS} days from today.`);
    const thana = v.text(req.body.thana, 80);
    if (!(await readDhakaThanas()).includes(thana)) return fail(res, 400, 'Please choose a valid Dhaka thana.');
    const address = v.text(req.body.address, 300);
    if (!address) return fail(res, 400, 'Please enter the service address.');
    // Every service is offered in every active area, and the booking must name one of them.
    const areas = await activeLocations();
    if (!areas.length) return fail(res, 400, 'No service areas are currently available.');
    const location = areas.find((row) => String(row._id) === String(req.body.locationId));
    if (!location) return fail(res, 400, 'Please choose a location we serve for this clean.');
    if (location.thana !== thana) return fail(res, 400, 'The address thana must match the service area.');
    // The price and scope are copied, so later service edits never change an existing booking.
    const booking = {
      serviceId: String(service._id), serviceName: service.serviceName, price: Number(service.price), date, address, notes: v.text(req.body.notes, 1000),
      locationId: String(location._id), locationName: [location.name, location.city].filter(Boolean).join(', '), thana,
      name: req.user.name, email: req.user.email, phone: req.user.phone || '', status: 'requested',
      scope: { details: service.details, includes: service.includes || [], duration: service.duration, suppliesIncluded: service.suppliesIncluded },
      createdAt: new Date().toISOString()
    };
    await bookings.insertOne(booking);
    res.json(booking);
  }));

  app.get('/bookingList', requireUser, asyncRoute(async (req, res) => res.json(await visibleBookings(req))));
  app.get('/orderList', requireStaff, asyncRoute(async (req, res) => res.json(await visibleBookings(req))));
  app.get('/bookings/:id', requireUser, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    const row = id && await bookings.findOne({ _id: id, ...scope(req) });
    if (!row) return fail(res, 403, 'Booking unavailable to this account.');
    res.json(safeBooking(row, req.role));
  }));

  // Admins confirm, assign and approve changes; the assigned staff member starts and completes the job.
  app.patch('/updateOrderList/:id', requireStaff, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    const row = id && await bookings.findOne({ _id: id });
    if (!row) return fail(res, 404, 'Booking not found.');
    if (!can(req.role, 'manage') && row.staffEmail !== req.user.email) return fail(res, 403, 'This job is not assigned to you.');
    const current = normalizeStatus(row.status);
    if (req.body.approveReschedule && can(req.role, 'manage')) {
      const date = row.changeRequest?.date;
      if (row.changeRequest?.type !== 'reschedule' || !v.isIsoDate(date) || date < v.earliestBookingDate() || ended(current)) return fail(res, 400, 'Reschedule request is no longer valid.');
      await bookings.updateOne({ _id: id }, { $set: { date, changeRequest: null } });
      await audit(req, 'reschedule approved', id);
      return res.json(true);
    }
    const status = req.body.status === undefined ? undefined : String(req.body.status);
    const update = {};
    if (status && status !== current) {
      if (!transitions[current]?.includes(status) || (req.role === 'staff' && !['in_progress', 'completed'].includes(status))) return fail(res, 400, 'Invalid status transition.');
      update.status = status;
    }
    if (req.body.staffEmail !== undefined) {
      if (!can(req.role, 'manage')) return fail(res, 403, 'Only the owner assigns jobs.');
      if (!['confirmed', 'assigned'].includes(current)) return fail(res, 400, 'Confirm the booking before assigning staff.');
      const email = v.normalizeEmail(req.body.staffEmail);
      const staff = await users.findOne({ email });
      if (!staff || staff.active === false || staff.invited || await teamRole(email) !== 'staff') return fail(res, 400, 'Choose active staff with a completed account.');
      update.staffEmail = email;
      update.status = 'assigned';
    }
    if (update.status === 'assigned' && !update.staffEmail && !row.staffEmail) return fail(res, 400, 'Assign a staff member first.');
    const note = v.text(req.body.internalNote, 2000);
    // A completed job's notes are its final record, so they are closed to new notes.
    if (note && current === 'completed') return fail(res, 400, 'Notes cannot be added to a completed job.');
    if (note) update.internalNotes = [...(row.internalNotes || []), { text: note, author: req.user.email, createdAt: new Date().toISOString() }];
    if (req.body.clearChangeRequest && can(req.role, 'manage')) update.changeRequest = null;
    // Matching the status read above stops two people changing the same booking at once.
    const result = await bookings.updateOne({ _id: id, status: row.status, ...(can(req.role, 'manage') ? {} : { staffEmail: req.user.email }) }, { $set: update });
    if (!result.matchedCount) return fail(res, 409, 'Booking changed. Refresh and try again.');
    await audit(req, 'booking updated', id);
    res.json(true);
  }));

  // A customer asks to cancel or reschedule one of their own bookings; an admin approves it.
  app.post('/bookings/:id/request', requireCustomer, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    const row = id && await bookings.findOne({ _id: id, email: req.user.email });
    if (!row) return fail(res, 403, 'Booking unavailable.');
    if (ended(row.status)) return fail(res, 400, 'This booking cannot be changed.');
    const type = String(req.body.type || ''), date = v.text(req.body.date, 10);
    if (!['cancellation', 'reschedule'].includes(type) || (type === 'reschedule' && (!v.isIsoDate(date) || date < v.earliestBookingDate()))) return fail(res, 400, 'Choose a valid request and date at least three days ahead.');
    await bookings.updateOne({ _id: id, email: req.user.email }, { $set: { changeRequest: { type, date: type === 'reschedule' ? date : null, createdAt: new Date().toISOString() } } });
    await audit(req, 'customer change request', id);
    res.json(true);
  }));
};
