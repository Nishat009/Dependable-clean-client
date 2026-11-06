// Checks the deployed demo end to end: the website answers, the API is healthy, and every demo role can sign in
// and load its dashboard data. Run: npm run check:live (override with LIVE_SITE_URL and LIVE_API_URL).
const site = (process.env.LIVE_SITE_URL || 'https://dependable-clean-client.vercel.app').replace(/\/$/, '');
const api = (process.env.LIVE_API_URL || 'https://dependable-clean-client.onrender.com').replace(/\/$/, '');
// Each role's first dashboard request, as the website makes it.
const dashboards = { customer: '/bookingList', staff: '/orderList', admin: '/reports' };

async function get(path, token, init = {}) {
  const response = await fetch(api + path, { ...init, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, signal: AbortSignal.timeout(90000) });
  return { status: response.status, data: await response.json().catch(() => null) };
}

async function main() {
  const failures = [];
  const check = (ok, label) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (!ok) failures.push(label); };
  const page = await fetch(site, { signal: AbortSignal.timeout(60000) });
  check(page.ok, `website ${site} answers ${page.status}`);
  const health = await get('/health');
  check(health.status === 200 && health.data?.ok, `API ${api}/health answers ${health.status} (${health.data?.mode})`);
  const options = await get('/authOptions');
  check(options.data?.demoEnabled === true, 'demo sign-in is enabled');
  for (const [role, path] of Object.entries(dashboards)) {
    const login = await get('/demoLogin', null, { method: 'POST', body: JSON.stringify({ role }) });
    check(login.status === 200 && Boolean(login.data?.token), `POST /demoLogin ${role} returns a session (role ${login.data?.user?.role})`);
    if (!login.data?.token) continue;
    const dashboard = await get(path, login.data.token);
    check(dashboard.status === 200, `${role} dashboard GET ${path} answers ${dashboard.status}`);
  }
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
