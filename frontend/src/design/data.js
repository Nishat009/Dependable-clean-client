export const demoServices = [
  {
    _id: '650000000000000000000001',
    product: 'spray',
    serviceName: 'Signature Home Clean',
    details: 'A thoughtful top-to-bottom refresh for a space that feels lighter the moment you walk in.',
    price: 89,
    category: 'Home care',
    duration: '3–4 hours',
    symbol: '✳',
  },
  {
    _id: '650000000000000000000002',
    product: 'dish',
    serviceName: 'Kitchen Revival',
    details: 'Counters, cabinets, surfaces and the little details brought back to their best.',
    price: 65,
    category: 'Deep clean',
    duration: '2–3 hours',
    symbol: '◈',
  },
  {
    _id: '650000000000000000000003',
    product: 'bath',
    serviceName: 'Bathroom Reset',
    details: 'A bright, fresh finish for every tile, fixture, mirror and hard-to-reach corner.',
    price: 55,
    category: 'Deep clean',
    duration: '2 hours',
    symbol: '✦',
  },
  {
    _id: '650000000000000000000004',
    product: 'detergent',
    serviceName: 'Laundry & Linen',
    details: 'Beautifully cared-for fabrics, folded linen and a wardrobe that feels refreshed.',
    price: 49,
    category: 'Home care',
    duration: '2 hours',
    symbol: '◎',
  },
  {
    _id: '650000000000000000000005',
    product: 'bucket',
    serviceName: 'Move-in Deep Clean',
    details: 'A full reset before the next chapter, from floors and baseboards to every surface.',
    price: 159,
    category: 'Specialty',
    duration: '5–6 hours',
    symbol: '◇',
  },
  {
    _id: '650000000000000000000006',
    product: 'pump',
    serviceName: 'Office Refresh',
    details: 'A crisp, welcoming workspace with the care and consistency your team deserves.',
    price: 119,
    category: 'Specialty',
    duration: '3–4 hours',
    symbol: '✧',
  },
];

// Hero slider: one cleaning product per service. Price and duration come from the live service when it exists.
export const heroSlides = [
  { product: 'spray', tab: 'Everyday', name: 'Citrus multi-surface spray', serviceId: '650000000000000000000001', accent: '#d7fb60', stat: ['40+', 'Surfaces refreshed'] },
  { product: 'dish', tab: 'Kitchen', name: 'Lime degreasing gel', serviceId: '650000000000000000000002', accent: '#9fdc45', stat: ['12', 'Kitchen zones'] },
  { product: 'bath', tab: 'Bathroom', name: 'Aqua tile & glass gel', serviceId: '650000000000000000000003', accent: '#7fe0d0', stat: ['100%', 'Fixtures polished'] },
  { product: 'detergent', tab: 'Laundry', name: 'Fresh linen detergent', serviceId: '650000000000000000000004', accent: '#e9f5b8', stat: ['6', 'Linen care steps'] },
  { product: 'bucket', tab: 'Deep clean', name: 'Deep reset kit', serviceId: '650000000000000000000005', accent: '#c4ec4f', stat: ['9', 'Rooms covered'] },
  { product: 'pump', tab: 'Office', name: 'Botanical foam soap', serviceId: '650000000000000000000006', accent: '#f1cf7a', stat: ['30+', 'Touchpoints wiped'] },
];

// Offer cards for the home page slider. Placeholder promotions: edit or remove before going live.
export const offers = [
  { product: 'spray', tag: 'First visit', percent: 20, text: 'Your first Signature Home Clean, with a little extra sparkle.', serviceId: '650000000000000000000001' },
  { product: 'detergent', tag: 'Weekly plan', percent: 30, text: 'Book a weekly linen refresh and save on every visit.', serviceId: '650000000000000000000004' },
  { product: 'dish', tag: 'Kitchen + bath', percent: 25, text: 'Pair a Kitchen Revival with a Bathroom Reset.', serviceId: '650000000000000000000002' },
  { product: 'bucket', tag: 'Moving day', percent: 15, text: 'A full move-in reset before the boxes arrive.', serviceId: '650000000000000000000005' },
  { product: 'pump', tag: 'Teams', percent: 18, text: 'A monthly office refresh for a workspace that stays crisp.', serviceId: '650000000000000000000006' },
];

export const serviceCategories = ['All services', 'Home care', 'Deep clean', 'Specialty'];

export function formatMoney(value) {
  const price = Number(value);
  return '$' + (Number.isFinite(price) ? price.toFixed(0) : '0');
}

export function formatDate(value) {
  if (!value) return 'Date to confirm';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
