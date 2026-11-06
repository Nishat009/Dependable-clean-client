const v = require('../validation');
const { can } = require('../permissions');

// Services and prices. Customers see active services; admins manage all of them.
module.exports = (app, { services, bookings, guards: { requireUser, requireAdmin }, audit, asyncRoute, fail, parseId }) => {
  const listServices = async () => (await services.find({}).toArray()).sort(v.byId);

  app.get('/services', asyncRoute(async (_req, res) => res.json((await listServices()).filter((s) => s.active !== false))));
  app.get('/serviceList', requireUser, asyncRoute(async (req, res) => res.json((await listServices()).filter((s) => can(req.role, 'manage') || s.active !== false))));
  app.get('/book/:id', requireUser, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid service id.');
    const service = await services.findOne({ _id: id });
    if (!service || (service.active === false && !can(req.role, 'manage'))) return fail(res, 404, 'Service not found.');
    res.json(service);
  }));

  app.post('/addService', requireAdmin, asyncRoute(async (req, res) => {
    const { service, error } = v.readService(req.body);
    if (error) return fail(res, 400, error);
    await services.insertOne(service);
    await audit(req, 'service created', service._id);
    res.json(service);
  }));
  app.patch('/updateService/:id', requireAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid service id.');
    const { service, error } = v.readService(req.body);
    if (error) return fail(res, 400, error);
    if (!(await services.updateOne({ _id: id }, { $set: service })).matchedCount) return fail(res, 404, 'Service not found.');
    await audit(req, 'service updated', id);
    res.json(await services.findOne({ _id: id }));
  }));
  // A service that bookings point to is switched off instead of deleted, so their history stays intact.
  app.delete('/deleteClasses/:id', requireAdmin, asyncRoute(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return fail(res, 400, 'Invalid service id.');
    if (await bookings.findOne({ serviceId: String(id) })) {
      if (!(await services.updateOne({ _id: id }, { $set: { active: false } })).matchedCount) return fail(res, 404, 'Service not found.');
      await audit(req, 'service archived', id);
      return res.json(true);
    }
    if (!(await services.deleteOne({ _id: id })).deletedCount) return fail(res, 404, 'Service not found.');
    await audit(req, 'service deleted', id);
    res.json(true);
  }));
};
