const { ObjectId } = require('mongodb');

// The service ids, names and details match demoServices in frontend/src/design/data.ts.
const services = [
  {
    serviceName: 'Signature Home Clean', price: 89, category: 'Home care', duration: '3–4 hours', teamSize: 2, idealFor: 'Homes up to 3 bedrooms',
    details: 'A thoughtful top-to-bottom refresh for a space that feels lighter the moment you walk in.',
    includes: ['Dusting of every reachable surface', 'Kitchen counters and appliance fronts', 'Bathroom sink, toilet and shower', 'Vacuuming and mopping of all floors', 'Beds made and linens straightened']
  },
  {
    serviceName: 'Kitchen Revival', price: 65, category: 'Deep clean', duration: '2–3 hours', teamSize: 1, idealFor: 'Kitchens of any size',
    details: 'Counters, cabinets, surfaces and the little details brought back to their best.',
    includes: ['Stovetop and backsplash degreased', 'Inside of the microwave', 'Cabinet fronts and handles', 'Sink and faucet descaled', 'Floor scrubbed and mopped']
  },
  {
    serviceName: 'Bathroom Reset', price: 55, category: 'Deep clean', duration: '2 hours', teamSize: 1, idealFor: 'Up to 2 bathrooms',
    details: 'A bright, fresh finish for every tile, fixture, mirror and hard-to-reach corner.',
    includes: ['Tiles and grout scrubbed', 'Shower glass and mirrors polished', 'Toilet sanitized inside and out', 'Taps and fixtures descaled', 'Floor disinfected']
  },
  {
    serviceName: 'Laundry & Linen', price: 49, category: 'Home care', duration: '2 hours', teamSize: 1, idealFor: 'Weekly linen care',
    details: 'Beautifully cared-for fabrics, folded linen and a wardrobe that feels refreshed.',
    includes: ['Up to 2 loads washed, dried and folded', 'Bed linen changed', 'Towels refreshed and folded', 'Light ironing of shirts']
  },
  {
    serviceName: 'Move-in Deep Clean', price: 159, category: 'Specialty', duration: '5–6 hours', teamSize: 3, idealFor: 'Empty homes before you move in or out',
    details: 'A full reset before the next chapter, from floors and baseboards to every surface.',
    includes: ['Inside cabinets, drawers and wardrobes', 'Baseboards, doors and switches', 'Inside the oven and fridge', 'Windows and sills from the inside', 'Every floor vacuumed and mopped']
  },
  {
    serviceName: 'Office Refresh', price: 119, category: 'Specialty', duration: '3–4 hours', teamSize: 2, idealFor: 'Offices up to 20 desks',
    details: 'A crisp, welcoming workspace with the care and consistency your team deserves.',
    includes: ['Desks and shared surfaces wiped', 'Kitchenette and break room cleaned', 'Restrooms sanitized', 'Bins emptied and relined', 'Floors vacuumed and mopped']
  }
];

function sampleData() {
  return {
    service: services.map((service, index) => ({ _id: new ObjectId('65000000000000000000000' + (index + 1)), ...service, suppliesIncluded: true, locations: [] })),
    review: [
      { name: 'Taylor M.', rating: 5, comments: 'Coming home to a space this fresh made my whole week.', status: 'Approved' },
      { name: 'Jordan L.', rating: 5, comments: 'The little details made the biggest difference.', status: 'Approved' }
    ],
    admin: [{ email: 'admin@dependableclean.demo', role: 'superAdmin' }],
    // Only the local preview uses these. Admins add real locations from the dashboard.
    location: [{ name: 'Gulshan 1', city: 'Dhaka', thana: 'Gulshan', address: 'Gulshan Avenue' }, { name: 'Dhanmondi Lake', city: 'Dhaka', thana: 'Dhanmondi', address: 'Road 27' }, { name: 'Uttara Sector 7', city: 'Dhaka', thana: 'Uttara West', address: 'Sector 7' }]
  };
}

module.exports = { sampleData };
