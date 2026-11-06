const v = require('../validation');

// Service areas. Every location is in Dhaka, inside one of its thanas.
module.exports = (app, { locations, bookings, guards: { requireUser, requireSuperAdmin }, readDhakaThanas, audit, asyncRoute, fail, parseId }) => {
  const listLocations = async () => (await locations.find({}).toArray()).sort((a, b) => a.name.localeCompare(b.name));
  const activeLocations = async () => (await listLocations()).filter((row) => row.active !== false);
  const readLocation = async (body) => {
    const location = { name: v.text(body.name, 80), city: 'Dhaka', thana: v.text(body.thana, 80), address: v.text(body.address, 200) };
    if (!location.name) return { error: 'Please enter a location name.' };
    if (!(await readDhakaThanas()).includes(location.thana)) return { error: 'Please choose a Dhaka thana from the list.' };
    return { location };
  };
  const locationTaken = async (name, exceptId) => (await locations.find({}).toArray())
    .some((row) => row.name.toLowerCase() === name.toLowerCase() && String(row._id) !== String(exceptId));

  // Customers only see the active areas. Signed-in staff and admins also see the ones switched off.
  app.get('/locations', asyncRoute(async (_req, res) => res.json(await activeLocations())));
  app.get('/locationList', requireUser, asyncRoute(async (_req, res) => res.json(await listLocations())));
  app.get('/dhakaThanas', asyncRoute(async (_req, res) => res.json(await readDhakaThanas())));

  app.post('/addLocation', requireSuperAdmin, asyncRoute(async (req, res) => {
    const { location, error } = await readLocation(req.body);
    if (error) return fail(res, 400, error);
    if (await locationTaken(location.name)) return fail(res, 409, 'That location is already on the list.');
    location.active = true;
    await locations.insertOne(location);
    await audit(req, 'service area created', location._id);
    res.json(location);
  }));
  app.patch('/updateLocation/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid location id.');
    const { location, error } = await readLocation(req.body);
    if (error) return fail(res, 400, error);
    if (await locationTaken(location.name, id)) return fail(res, 409, 'That location is already on the list.');
    const result = await locations.updateOne({ _id: id }, { $set: location });
    if (!result.matchedCount) return fail(res, 404, 'Location not found.');
    await audit(req, 'service area updated', id);
    res.json({ _id: id, ...location });
  }));
  app.patch('/locationStatus/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid location id.');
    if (typeof req.body.active !== 'boolean') return fail(res, 400, 'Please choose active or inactive.');
    if (!(await locations.updateOne({ _id: id }, { $set: { active: req.body.active } })).matchedCount) return fail(res, 404, 'Location not found.');
    await audit(req, req.body.active ? 'service area activated' : 'service area deactivated', id);
    res.json(await locations.findOne({ _id: id }));
  }));
  // A location that bookings point to is switched off instead of deleted, so their history stays intact.
  app.delete('/deleteLocation/:id', requireSuperAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid location id.');
    if (await bookings.findOne({ locationId: String(id) })) {
      if (!(await locations.updateOne({ _id: id }, { $set: { active: false } })).matchedCount) return fail(res, 404, 'Location not found.');
      await audit(req, 'service area archived', id);
      return res.json(true);
    }
    if (!(await locations.deleteOne({ _id: id })).deletedCount) return fail(res, 404, 'Location not found.');
    await audit(req, 'service area deleted', id);
    res.json(true);
  }));

  return { activeLocations };
};
