// A sub admin runs the business like the owner, except for adding or changing team members.
const permissions = {
    super_admin: ['manage', 'team', 'jobs', 'support', 'profile'],
    sub_admin: ['manage', 'jobs', 'support', 'profile'],
    // Staff only see the support tickets the owner assigns to them.
    staff: ['jobs', 'support', 'profile'],
    customer: ['book', 'support', 'profile']
};
// The roles the owner can give someone from the Team page.
const teamRoles = ['staff', 'sub_admin'];
const can = (role, permission) => Boolean(permissions[role]?.includes(permission));
const normalizeRole = (role) => ['superAdmin', 'admin', 'super_admin'].includes(role) ? 'super_admin' : role || 'customer';
const normalizeStatus = (status) => ({ Pending: 'requested', Confirmed: 'confirmed', Assigned: 'assigned', 'In progress': 'in_progress', Completed: 'completed', Cancelled: 'cancelled' }[status] || status);
const transitions = { requested: ['confirmed', 'cancelled'], confirmed: ['assigned', 'cancelled'], assigned: ['in_progress', 'cancelled'], in_progress: ['completed'], completed: [], cancelled: [] };
module.exports = { permissions, teamRoles, can, normalizeRole, normalizeStatus, transitions };
