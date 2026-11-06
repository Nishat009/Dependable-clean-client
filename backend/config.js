require('dotenv').config({ quiet: true });

// Every setting the API reads, checked once at startup.
const env = process.env;
const production = env.NODE_ENV === 'production';
const mongoUri = env.MONGODB_URI || null;

// Signing tokens with a missing, short or example secret would let anyone forge a session, so production refuses to start.
function readAuthSecret() {
  const secret = env.AUTH_SECRET || '';
  const weak = secret.length < 32 || /change-?me/i.test(secret);
  if (production && weak) {
    throw new Error('AUTH_SECRET must be set to a random value of at least 32 characters in production. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  // Outside production a missing secret is replaced by a per-process one, so tokens simply expire when the API restarts.
  return weak ? require('node:crypto').randomBytes(32).toString('hex') : secret;
}

const config = {
  production,
  port: Number(env.PORT) || 5000,
  databaseName: env.DB_NAME || 'houseCleaning',
  mongoUri,
  // Without MONGODB_URI, development and tests run on in-memory sample data. Production always needs a database.
  demoMode: !mongoUri && !production,
  // Demo sign-in is on in development unless DEMO_ACCOUNTS=off, and off in production unless DEMO_ACCOUNTS=on.
  demoEnabled: env.DEMO_ACCOUNTS === 'on' || (!production && env.DEMO_ACCOUNTS !== 'off'),
  // CLIENT_ORIGIN can list several sites, separated by commas, such as the Vercel URL and localhost.
  clientOrigins: (env.CLIENT_ORIGIN || 'http://localhost:3000').split(',').map((origin) => origin.trim().replace(/\/$/, '')).filter(Boolean),
  // Sign-in attempts allowed per IP address and email in each 15-minute window.
  authRateLimit: Number(env.AUTH_RATE_LIMIT) || 20,
  // Render, Vercel and most hosts sit behind one proxy, which sets the client IP used by the rate limiter.
  trustProxy: env.TRUST_PROXY !== undefined ? Number(env.TRUST_PROXY) : production ? 1 : 0,
  authSecret: readAuthSecret(),
  dnsServers: env.DNS_SERVERS ? env.DNS_SERVERS.split(',').map((server) => server.trim()) : null
};

// Some networks refuse the SRV lookups that mongodb+srv:// needs, so DNS_SERVERS can name other resolvers.
if (config.dnsServers) require('node:dns').setServers(config.dnsServers);

module.exports = config;
