const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { earliestBookingDate, isIsoDate } = require('./validation');
const { can, normalizeStatus, transitions } = require('./permissions');
const port = 5197, base = `http://127.0.0.1:${port}`;
async function request(path, token, method = 'GET', body) {
    const response = await fetch(base + path, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, data: await response.json() };
}
test('business calendar and permission rules', () => {
    assert.equal(earliestBookingDate(Date.parse('2026-10-10T20:00:00Z')), '2026-10-14');
    assert.equal(isIsoDate('2026-02-30'), false);
    assert.equal(can('staff', 'manage'), false);
    assert.equal(can('customer', 'jobs'), false);
    assert.equal(normalizeStatus('Pending'), 'requested');
    assert.deepEqual(transitions.assigned, ['in_progress', 'cancelled']);
});
test('direct API role, ownership and workflow verification', async (t) => {
    const server = spawn(process.execPath, ['backend/index.js'], { cwd: require('node:path').resolve(__dirname, '..'), env: { ...process.env, PORT: String(port), NODE_ENV: 'test', MONGODB_URI: '', DB_USER: '', DB_PASS: '', DEMO_ACCOUNTS: 'on' } });
    let output = '';
    server.stdout.on('data', d => output += d);
    server.stderr.on('data', d => { output += d; process.stderr.write(d); });
    t.after(async () => { server.kill(); await once(server, 'exit').catch(() => { }); });
    for (let i = 0; i < 100; i++) {
        try {
            if ((await request('/health')).status === 200)
                break;
        }
        catch { }
        await new Promise(r => setTimeout(r, 100));
        if (i === 99)
            throw Error(output);
    }
    const login = async (role) => { const r = await request('/demoLogin', null, 'POST', { role }); assert.equal(r.status, 200); return r.data.token; };
    const owner = await login('admin'), staff = await login('staff'), customer = await login('customer');
    assert.equal((await request('/me', owner)).data.role, 'super_admin');
    assert.equal((await request('/orderList')).status, 401);
    const other = (await request('/signup', null, 'POST', { name: 'Other', email: 'other@example.test', password: 'very-secure-pass-123', role: 'super_admin' })).data.token;
    assert.equal((await request('/me', other)).data.role, 'customer');
    for (const token of [staff, customer, other])
        for (const [path, method] of [['/addService', 'POST'], ['/updateService/650000000000000000000001', 'PATCH'], ['/deleteClasses/650000000000000000000001', 'DELETE'], ['/addLocation', 'POST'], ['/updateLocation/650000000000000000000001', 'PATCH'], ['/locationStatus/650000000000000000000001', 'PATCH'], ['/deleteLocation/650000000000000000000001', 'DELETE'], ['/addAdmin', 'POST'], ['/admin', 'GET'], ['/reviewList', 'GET'], ['/teamReviews', 'GET'], ['/updateReview/650000000000000000000001', 'PATCH'], ['/deleteReview/650000000000000000000001', 'DELETE'], ['/reports', 'GET'], ['/activity', 'GET'], ['/business', 'PATCH'], ['/staff/a', 'PATCH']])
            assert.equal((await request(path, token, method, method === 'GET' ? undefined : {})).status, 403, path);
    assert.deepEqual((await request('/support', staff)).data, []);
    assert.equal((await request('/profile', customer, 'PATCH', { name: 'Updated', role: 'super_admin', email: 'admin@dependableclean.demo' })).status, 200);
    assert.equal((await request('/me', customer)).data.role, 'customer');
    const services = (await request('/services')).data, locations = (await request('/locations')).data;
    const service = services[0], location = locations[0];
    const fields = { serviceId: service._id, date: earliestBookingDate(), address: 'Road 1, House 2', locationId: location._id, thana: location.thana, email: 'other@example.test', staffEmail: 'staff@dependableclean.demo' };
    for (const bad of [{ date: '2026-02-30' }, { date: '2000-01-01' }, { address: '' }, { locationId: 'bad' }, { thana: 'Invalid' }])
        assert.equal((await request('/addAllBook', customer, 'POST', { ...fields, ...bad })).status, 400);
    assert.equal((await request('/addAllBook', staff, 'POST', fields)).status, 403);
    assert.equal((await request('/locationStatus/' + location._id, owner, 'PATCH', { active: false })).status, 200);
    assert.equal((await request('/locations')).data.some(row => row._id === location._id), false);
    assert.equal((await request('/locationList', staff)).data.find(row => row._id === location._id).active, false);
    assert.equal((await request('/addAllBook', customer, 'POST', fields)).status, 400);
    assert.equal((await request('/locationStatus/' + location._id, owner, 'PATCH', { active: true })).status, 200);
    const booked = await request('/addAllBook', customer, 'POST', fields);
    assert.equal(booked.status, 200);
    const id = booked.data._id;
    assert.equal(booked.data.email, 'customer@dependableclean.demo');
    assert.equal(booked.data.status, 'requested');
    assert.ok(booked.data.scope);
    assert.equal(booked.data.staffEmail, undefined);
    assert.equal((await request('/updateService/' + service._id, owner, 'PATCH', { ...service, price: Number(service.price) + 100, details: 'Edited service scope', includes: ['New scope'] })).status, 200);
    const historic = (await request('/bookings/' + id, customer)).data;
    assert.equal(historic.price, Number(service.price));
    assert.equal(historic.scope.details, service.details);
    assert.equal((await request('/bookings/' + id + '/request', other, 'POST', { type: 'cancellation' })).status, 403);
    assert.equal((await request('/staff/admin@dependableclean.demo', owner, 'PATCH', { active: false })).status, 403);
    const createdService = await request('/addService', owner, 'POST', { serviceName: 'Test service', details: 'Test scope', price: 300 });
    assert.equal(createdService.status, 200);
    assert.equal((await request('/updateService/' + createdService.data._id, owner, 'PATCH', { ...createdService.data, active: false })).status, 200);
    assert.equal((await request('/services')).data.some(row => row._id === createdService.data._id), false);
    assert.equal((await request('/book/' + createdService.data._id, staff)).status, 404);
    assert.equal((await request('/deleteClasses/' + createdService.data._id, owner, 'DELETE')).status, 200);

    assert.equal((await request('/bookings/' + id, other)).status, 403);
    assert.equal((await request('/bookings/' + id, staff)).status, 403);
    assert.deepEqual((await request('/orderList', staff)).data, []);
    assert.equal((await request('/updateOrderList/' + id, customer, 'PATCH', { status: 'completed' })).status, 403);
    assert.equal((await request('/updateOrderList/' + id, owner, 'PATCH', { status: 'completed' })).status, 400);
    assert.equal((await request('/addReview', customer, 'POST', { orderId: id, comments: 'Excellent clean', rating: 5 })).status, 403);
    assert.equal((await request('/updateOrderList/' + id, owner, 'PATCH', { staffEmail: 'staff@dependableclean.demo' })).status, 400);
    assert.equal((await request('/updateOrderList/' + id, owner, 'PATCH', { status: 'confirmed' })).status, 200);
    assert.equal((await request('/updateOrderList/' + id, owner, 'PATCH', { staffEmail: 'staff@dependableclean.demo' })).status, 200);
    assert.equal((await request('/orderList', staff)).data.length, 1);
    assert.equal((await request('/updateOrderList/' + id, staff, 'PATCH', { staffEmail: 'other@example.test' })).status, 403);
    assert.equal((await request('/updateOrderList/' + id, staff, 'PATCH', { status: 'completed' })).status, 400);
    const rescheduleDate = new Date(Date.parse(fields.date) + 86400000).toISOString().slice(0, 10);
    assert.equal((await request('/bookings/' + id + '/request', customer, 'POST', { type: 'reschedule', date: rescheduleDate })).status, 200);
    assert.equal((await request('/updateOrderList/' + id, owner, 'PATCH', { approveReschedule: true })).status, 200);
    assert.equal((await request('/bookings/' + id, customer)).data.date, rescheduleDate);
    assert.equal((await request('/updateOrderList/' + id, staff, 'PATCH', { status: 'in_progress', internalNote: 'Private access code' })).status, 200);
    assert.equal((await request('/bookings/' + id, customer)).data.internalNotes, undefined);
    assert.equal((await request('/updateOrderList/' + id, staff, 'PATCH', { status: 'completed' })).status, 200);
    for (const token of [staff, owner])
        assert.equal((await request('/updateOrderList/' + id, token, 'PATCH', { internalNote: 'Too late' })).status, 400);
    assert.equal((await request('/orderList', owner)).data.find(row => row._id === id).internalNotes.length, 1);
    assert.equal((await request('/addReview', other, 'POST', { orderId: id, comments: 'Other account review', rating: 5 })).status, 403);
    const attempts = await Promise.all([1,2].map(() => request('/addReview', customer, 'POST', { orderId: id, comments: 'Excellent clean', rating: 5 })));
    assert.deepEqual(attempts.map(r=>r.status).sort(),[200,409]);
    const review = attempts.find(r=>r.status===200);
    assert.equal(review.status, 200);
    assert.equal(review.data.status, 'Pending');
    assert.equal((await request('/addReview', customer, 'POST', { orderId: id, comments: 'Excellent clean', rating: 5 })).status, 409);
    assert.equal((await request('/reviews')).data.some(r => r._id === review.data._id), false);
    await request('/updateReview/' + review.data._id, owner, 'PATCH', { status: 'Approved' });
    assert.equal((await request('/reviews')).data.some(r => r._id === review.data._id), true);
    await request('/updateReview/' + review.data._id, owner, 'PATCH', { status: 'Hidden' });
    assert.equal((await request('/reviews')).data.some(r => r._id === review.data._id), false);
    const conversation = await request('/support', customer, 'POST', {});
    const cid = conversation.data._id;
    for (const token of [staff, other])
        for (const suffix of ['', '/messages'])
            assert.equal((await request('/support/' + cid + suffix, token, suffix ? 'GET' : 'PATCH', suffix ? undefined : { status: 'resolved' })).status, 403);
    assert.equal((await request('/support/' + cid + '/messages', customer, 'POST', { text: 'Hello owner', email: 'other@example.test' })).status, 200);
    assert.equal((await request('/support', owner)).data[0].unread, 1);
    assert.equal((await request('/support/' + cid + '/messages', owner)).data[0].author, 'customer@dependableclean.demo');
    assert.equal((await request('/support', owner)).data[0].unread, 0);
    await request('/support/' + cid + '/messages', owner, 'POST', { text: 'Hello customer' });
    assert.equal((await request('/support', customer)).data[0].unread, 1);
    assert.equal((await request('/support/' + cid, owner, 'PATCH', { status: 'resolved' })).status, 200);
    assert.equal((await request('/support/' + cid, owner, 'PATCH', { staffEmail: 'customer@dependableclean.demo' })).status, 400);
    assert.equal((await request('/support/' + cid, owner, 'PATCH', { staffEmail: 'staff@dependableclean.demo' })).status, 200);
    assert.equal((await request('/support', owner)).data[0].staffEmail, 'staff@dependableclean.demo');
    assert.equal((await request('/support', customer)).data[0].staffEmail, undefined);
    assert.equal((await request('/support', staff)).data.length, 1);
    assert.equal((await request('/support/' + cid + '/messages', staff)).status, 200);
    assert.equal((await request('/support/' + cid + '/messages', staff, 'POST', { text: 'Staff here to help' })).status, 200);
    assert.equal((await request('/support', customer)).data[0].status, 'resolved');
    const reply = (await request('/support/' + cid + '/messages', customer)).data.at(-1);
    assert.deepEqual([reply.author, reply.authorName], ['support', 'Sam Chowdhury']);
    assert.equal((await request('/support/' + cid, staff, 'PATCH', { staffEmail: '' })).status, 403);
    assert.equal((await request('/support/' + cid, staff, 'PATCH', { status: 'open' })).status, 200);
    assert.equal((await request('/support/' + cid, customer, 'PATCH', { status: 'resolved' })).status, 403);
    for (let i = 0; i < 9; i++)
        assert.equal((await request('/support/' + cid + '/messages', customer, 'POST', { text: 'Message' })).status, 200);
    assert.equal((await request('/support/' + cid + '/messages', customer, 'POST', { text: 'Too many' })).status, 429);
    // The owner sets the new team member's password, and they can sign in with it straight away.
    const newMember = { email: 'newstaff@example.test', name: 'New Staff', password: 'staff-secure-password' };
    assert.equal((await request('/addAdmin', owner, 'POST', { ...newMember, password: 'short' })).status, 400);
    assert.equal((await request('/addAdmin', owner, 'POST', { ...newMember, role: 'super_admin' })).status, 400);
    const added = await request('/addAdmin', owner, 'POST', newMember);
    assert.equal(added.status, 200);
    assert.deepEqual(added.data, { email: 'newstaff@example.test', name: 'New Staff', role: 'staff' });
    assert.equal((await request('/addAdmin', owner, 'POST', newMember)).status, 409);
    assert.equal((await request('/addAdmin', owner, 'POST', { ...newMember, email: 'other@example.test' })).status, 409);
    assert.equal((await request('/login', null, 'POST', { email: 'other@example.test', password: 'staff-secure-password' })).status, 401);
    const signedIn = await request('/login', null, 'POST', { email: newMember.email, password: newMember.password });
    assert.equal(signedIn.data.user.role, 'staff');
    const newStaff = signedIn.data.token;
    assert.equal((await request('/bookings/' + id, newStaff)).status, 403);
    assert.equal((await request('/updateOrderList/' + id, newStaff, 'PATCH', { status: 'in_progress' })).status, 403);
    assert.equal((await request('/staff/staff@dependableclean.demo', owner, 'PATCH', { active: false })).status, 200);
    assert.equal((await request('/me', staff)).status, 401);
    assert.equal((await request('/orderList', staff)).status, 401);
    assert.equal((await request('/demoLogin', null, 'POST', { role: 'staff' })).status, 401);
    assert.equal((await request('/orderList', owner)).data[0].staffEmail, 'staff@dependableclean.demo');
    assert.ok((await request('/activity', owner)).data.some(r => r.action === 'booking updated'));
    assert.equal((await request('/reports', owner)).data.recordedPayments, 0);
    assert.equal((await request('/business', owner, 'PATCH', { email: 'real@example.test', faq: 'Contact the owner', offers: 'No current offers' })).status, 200);
    assert.equal((await request('/business')).data.email, 'real@example.test');
});
