-- Dependable Clean demo data
--
-- The same demo data that backend/seed.js adds to MongoDB (npm run db:setup), as SQL
-- INSERT statements for the tables in database/schema.sql. backend/seed.js is the seed
-- the app uses; the data comes from backend/sampleData.js.
--
-- The three demo sign-in accounts (owner, staff, customer) are not inserted here. The API
-- creates them, with hashed passwords, when it starts with DEMO_ACCOUNTS on. Their emails
-- and passwords are listed in HowToSetup.md.

-- Services (ids match the frontend's demo services).
INSERT INTO service (id, serviceName, price, category, duration, teamSize, idealFor, details, includes, suppliesIncluded, active) VALUES
('650000000000000000000001', 'Signature Home Clean', 89, 'Home care', '3–4 hours', 2, 'Homes up to 3 bedrooms',
 'A thoughtful top-to-bottom refresh for a space that feels lighter the moment you walk in.',
 '["Dusting of every reachable surface", "Kitchen counters and appliance fronts", "Bathroom sink, toilet and shower", "Vacuuming and mopping of all floors", "Beds made and linens straightened"]', TRUE, TRUE),
('650000000000000000000002', 'Kitchen Revival', 65, 'Deep clean', '2–3 hours', 1, 'Kitchens of any size',
 'Counters, cabinets, surfaces and the little details brought back to their best.',
 '["Stovetop and backsplash degreased", "Inside of the microwave", "Cabinet fronts and handles", "Sink and faucet descaled", "Floor scrubbed and mopped"]', TRUE, TRUE),
('650000000000000000000003', 'Bathroom Reset', 55, 'Deep clean', '2 hours', 1, 'Up to 2 bathrooms',
 'A bright, fresh finish for every tile, fixture, mirror and hard-to-reach corner.',
 '["Tiles and grout scrubbed", "Shower glass and mirrors polished", "Toilet sanitized inside and out", "Taps and fixtures descaled", "Floor disinfected"]', TRUE, TRUE),
('650000000000000000000004', 'Laundry & Linen', 49, 'Home care', '2 hours', 1, 'Weekly linen care',
 'Beautifully cared-for fabrics, folded linen and a wardrobe that feels refreshed.',
 '["Up to 2 loads washed, dried and folded", "Bed linen changed", "Towels refreshed and folded", "Light ironing of shirts"]', TRUE, TRUE),
('650000000000000000000005', 'Move-in Deep Clean', 159, 'Specialty', '5–6 hours', 3, 'Empty homes before you move in or out',
 'A full reset before the next chapter, from floors and baseboards to every surface.',
 '["Inside cabinets, drawers and wardrobes", "Baseboards, doors and switches", "Inside the oven and fridge", "Windows and sills from the inside", "Every floor vacuumed and mopped"]', TRUE, TRUE),
('650000000000000000000006', 'Office Refresh', 119, 'Specialty', '3–4 hours', 2, 'Offices up to 20 desks',
 'A crisp, welcoming workspace with the care and consistency your team deserves.',
 '["Desks and shared surfaces wiped", "Kitchenette and break room cleaned", "Restrooms sanitized", "Bins emptied and relined", "Floors vacuumed and mopped"]', TRUE, TRUE);

-- Service areas in Dhaka.
INSERT INTO location (id, name, city, thana, address, active) VALUES
('660000000000000000000001', 'Gulshan 1', 'Dhaka', 'Gulshan', 'Gulshan Avenue', TRUE),
('660000000000000000000002', 'Dhanmondi Lake', 'Dhaka', 'Dhanmondi', 'Road 27', TRUE),
('660000000000000000000003', 'Uttara Sector 7', 'Dhaka', 'Uttara West', 'Sector 7', TRUE);

-- Approved reviews shown on the website.
INSERT INTO review (id, name, rating, comments, status) VALUES
('670000000000000000000001', 'Taylor M.', 5, 'Coming home to a space this fresh made my whole week.', 'Approved'),
('670000000000000000000002', 'Jordan L.', 5, 'The little details made the biggest difference.', 'Approved');

-- The demo owner's team role.
INSERT INTO admin (id, email, role) VALUES
('680000000000000000000001', 'admin@dependableclean.demo', 'superAdmin');
