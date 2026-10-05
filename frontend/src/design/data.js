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
