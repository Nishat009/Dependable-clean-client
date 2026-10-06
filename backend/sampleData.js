const { ObjectId } = require('mongodb');

const names = ['Signature Home Clean', 'Kitchen Revival', 'Bathroom Reset', 'Laundry & Linen', 'Move-in Deep Clean', 'Office Refresh'];
const prices = [89, 65, 55, 49, 159, 119];
const descriptions = [
  'A thoughtful top-to-bottom refresh for a space that feels lighter the moment you walk in.',
  'Counters, cabinets, surfaces and the little details brought back to their best.',
  'A bright, fresh finish for every tile, fixture, mirror and hard-to-reach corner.',
  'Beautifully cared-for fabrics, folded linen and a wardrobe that feels refreshed.',
  'A full reset before the next chapter, from floors and baseboards to every surface.',
  'A crisp, welcoming workspace with the care and consistency your team deserves.'
];
const categories = ['Home care', 'Deep clean', 'Deep clean', 'Home care', 'Specialty', 'Specialty'];
const durations = ['3–4 hours', '2–3 hours', '2 hours', '2 hours', '5–6 hours', '3–4 hours'];

// The service ids match demoServices in frontend/src/design/data.js.
function sampleData() {
  return {
    service: names.map((serviceName, index) => ({ _id: new ObjectId('65000000000000000000000' + (index + 1)), serviceName, details: descriptions[index], price: prices[index], category: categories[index], duration: durations[index] })),
    review: [{ name: 'Taylor M.', comments: 'Coming home to a space this fresh made my whole week.' }, { name: 'Jordan L.', comments: 'The little details made the biggest difference.' }],
    admin: [{ email: 'admin@dependableclean.demo' }]
  };
}

module.exports = { sampleData };
