import type { Location, ProductType, Service } from './types';

// Shown until the API answers. The ids and details match backend/sampleData.js.
export const demoServices: Service[] = [
  {
    _id: '650000000000000000000001', product: 'spray', serviceName: 'Signature Home Clean', price: 89, category: 'Home care', duration: '3–4 hours',
    details: 'A thoughtful top-to-bottom refresh for a space that feels lighter the moment you walk in.',
    teamSize: 2, idealFor: 'Homes up to 3 bedrooms', suppliesIncluded: true, locations: [],
    includes: ['Dusting of every reachable surface', 'Kitchen counters and appliance fronts', 'Bathroom sink, toilet and shower', 'Vacuuming and mopping of all floors', 'Beds made and linens straightened'],
  },
  {
    _id: '650000000000000000000002', product: 'dish', serviceName: 'Kitchen Revival', price: 65, category: 'Deep clean', duration: '2–3 hours',
    details: 'Counters, cabinets, surfaces and the little details brought back to their best.',
    teamSize: 1, idealFor: 'Kitchens of any size', suppliesIncluded: true, locations: [],
    includes: ['Stovetop and backsplash degreased', 'Inside of the microwave', 'Cabinet fronts and handles', 'Sink and faucet descaled', 'Floor scrubbed and mopped'],
  },
  {
    _id: '650000000000000000000003', product: 'bath', serviceName: 'Bathroom Reset', price: 55, category: 'Deep clean', duration: '2 hours',
    details: 'A bright, fresh finish for every tile, fixture, mirror and hard-to-reach corner.',
    teamSize: 1, idealFor: 'Up to 2 bathrooms', suppliesIncluded: true, locations: [],
    includes: ['Tiles and grout scrubbed', 'Shower glass and mirrors polished', 'Toilet sanitized inside and out', 'Taps and fixtures descaled', 'Floor disinfected'],
  },
  {
    _id: '650000000000000000000004', product: 'detergent', serviceName: 'Laundry & Linen', price: 49, category: 'Home care', duration: '2 hours',
    details: 'Beautifully cared-for fabrics, folded linen and a wardrobe that feels refreshed.',
    teamSize: 1, idealFor: 'Weekly linen care', suppliesIncluded: true, locations: [],
    includes: ['Up to 2 loads washed, dried and folded', 'Bed linen changed', 'Towels refreshed and folded', 'Light ironing of shirts'],
  },
  {
    _id: '650000000000000000000005', product: 'bucket', serviceName: 'Move-in Deep Clean', price: 159, category: 'Specialty', duration: '5–6 hours',
    details: 'A full reset before the next chapter, from floors and baseboards to every surface.',
    teamSize: 3, idealFor: 'Empty homes before you move in or out', suppliesIncluded: true, locations: [],
    includes: ['Inside cabinets, drawers and wardrobes', 'Baseboards, doors and switches', 'Inside the oven and fridge', 'Windows and sills from the inside', 'Every floor vacuumed and mopped'],
  },
  {
    _id: '650000000000000000000006', product: 'pump', serviceName: 'Office Refresh', price: 119, category: 'Specialty', duration: '3–4 hours',
    details: 'A crisp, welcoming workspace with the care and consistency your team deserves.',
    teamSize: 2, idealFor: 'Offices up to 20 desks', suppliesIncluded: true, locations: [],
    includes: ['Desks and shared surfaces wiped', 'Kitchenette and break room cleaned', 'Restrooms sanitized', 'Bins emptied and relined', 'Floors vacuumed and mopped'],
  },
];

export interface HeroSlide {
  product: ProductType;
  tab: string;
  name: string;
  serviceId: string;
  accent: string;
  stat: [string, string];
}

// Hero slider: one cleaning product per service. Price and duration come from the live service when it exists.
export const heroSlides: HeroSlide[] = [
  { product: 'spray', tab: 'Everyday', name: 'Clear multi-surface spray', serviceId: '650000000000000000000001', accent: '#d7fb60', stat: ['40+', 'Surfaces refreshed'] },
  { product: 'dish', tab: 'Kitchen', name: 'Amber kitchen cleaner', serviceId: '650000000000000000000002', accent: '#9fdc45', stat: ['12', 'Kitchen zones'] },
  { product: 'bath', tab: 'Bathroom', name: 'Eco tile & tub spray', serviceId: '650000000000000000000003', accent: '#7fe0d0', stat: ['100%', 'Fixtures polished'] },
  { product: 'detergent', tab: 'Laundry', name: 'Soft linen wash', serviceId: '650000000000000000000004', accent: '#e9f5b8', stat: ['6', 'Linen care steps'] },
  { product: 'bucket', tab: 'Deep clean', name: 'Deep reset kit', serviceId: '650000000000000000000005', accent: '#c4ec4f', stat: ['9', 'Rooms covered'] },
  { product: 'pump', tab: 'Office', name: 'Botanical hand soap', serviceId: '650000000000000000000006', accent: '#f1cf7a', stat: ['30+', 'Touchpoints wiped'] },
];

export interface Offer {
  product: ProductType;
  tag: string;
  percent: number;
  text: string;
  serviceId: string;
}

// Offer cards for the home page slider. Placeholder promotions: edit or remove before going live.
export const offers: Offer[] = [
  { product: 'spray', tag: 'First visit', percent: 20, text: 'Your first Signature Home Clean, with a little extra sparkle.', serviceId: '650000000000000000000001' },
  { product: 'detergent', tag: 'Weekly plan', percent: 30, text: 'Book a weekly linen refresh and save on every visit.', serviceId: '650000000000000000000004' },
  { product: 'dish', tag: 'Kitchen + bath', percent: 25, text: 'Pair a Kitchen Revival with a Bathroom Reset.', serviceId: '650000000000000000000002' },
  { product: 'bucket', tag: 'Moving day', percent: 15, text: 'A full move-in reset before the boxes arrive.', serviceId: '650000000000000000000005' },
  { product: 'pump', tag: 'Teams', percent: 18, text: 'A monthly office refresh for a workspace that stays crisp.', serviceId: '650000000000000000000006' },
];

export const serviceCategories = ['All services', 'Home care', 'Deep clean', 'Specialty'] as const;

/** Bookings must be at least this many days away. The API checks the same rule. */
export const BOOKING_LEAD_DAYS = 3;

const isoDate = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

/** The earliest bookable date in the visitor's own calendar, as YYYY-MM-DD. */
export function earliestBookingDate(now = new Date()): string {
  const date = new Date(now);
  date.setDate(date.getDate() + BOOKING_LEAD_DAYS);
  return isoDate(date);
}

export function formatMoney(value: unknown): string {
  const price = Number(value);
  return '$' + (Number.isFinite(price) ? price.toFixed(0) : '0');
}

export function formatDate(value?: string | null): string {
  if (!value) return 'Date to confirm';
  // Date-only strings are calendar days, so read them as local dates rather than UTC midnight.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + 'T00:00:00') : new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export const thanaOptions = (thanas: string[]) => thanas.map((thana) => ({ value: thana, label: thana }));

/** Where a location is, such as "Gulshan, Dhaka · Road 11". */
export function describeLocation(location: Location): string {
  return [location.thana ? location.thana + ', Dhaka' : location.city, location.address].filter(Boolean).join(' · ') || 'Dhaka';
}
