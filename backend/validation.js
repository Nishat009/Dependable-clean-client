const BOOKING_LEAD_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const bookingStatuses = ['requested', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'];
const reviewStatuses = ['Pending', 'Approved', 'Rejected', 'Hidden'];

const text = (value, max = 2000) => String(value ?? '').trim().slice(0, max);
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Calendar days in the configured business timezone, independent of the server timezone.
function earliestBookingDate(now = Date.now()) {
  return new Date(Date.parse(new Intl.DateTimeFormat('en-CA', { timeZone: process.env.BUSINESS_TIMEZONE || 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now))) + BOOKING_LEAD_DAYS * DAY_MS).toISOString().slice(0, 10);
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

// Reads the service fields an admin can set.
function readService(body) {
  const includes = Array.isArray(body.includes) ? body.includes : String(body.includes || '').split('\n');
  const service = {
    active: body.active !== false,
    serviceName: text(body.serviceName, 120),
    details: text(body.details),
    category: text(body.category, 60) || 'Home care',
    duration: text(body.duration, 60),
    price: Number(body.price),
    teamSize: Math.round(Number(body.teamSize)) || 1,
    idealFor: text(body.idealFor, 160),
    suppliesIncluded: body.suppliesIncluded === true || body.suppliesIncluded === 'true',
    includes: includes.map((item) => text(item, 160)).filter(Boolean).slice(0, 20)
  };
  if (!service.serviceName) return { error: 'Please enter a service name.' };
  if (!service.details) return { error: 'Please add a short description.' };
  if (!Number.isFinite(service.price) || service.price <= 0) return { error: 'Please enter a price above 0.' };
  if (service.teamSize < 1 || service.teamSize > 20) return { error: 'The team size should be between 1 and 20.' };
  return { service };
}

const byId = (a, b) => String(a._id).localeCompare(String(b._id));
const newestFirst = (a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')) || String(b._id).localeCompare(String(a._id));

module.exports = { BOOKING_LEAD_DAYS, bookingStatuses, reviewStatuses, text, normalizeEmail, isEmail, earliestBookingDate, isIsoDate, readService, byId, newestFirst };
