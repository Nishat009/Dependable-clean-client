const fs = require('node:fs');
const path = require('node:path');

// Inside the combined Dependable-clean folder the parent package.json lists "frontend" as a workspace, so npm hoists
// packages to the parent node_modules and Turbopack needs the parent as its root. This checks the workspace setup,
// not whether node_modules happens to exist yet, so the root is the same before and after `npm install`.
// Installed on its own, the client keeps Turbopack's default root.
const parent = path.resolve(__dirname, '..');
function inWorkspace() {
  try {
    const { workspaces } = JSON.parse(fs.readFileSync(path.join(parent, 'package.json'), 'utf8'));
    const list = Array.isArray(workspaces) ? workspaces : workspaces?.packages;
    return Array.isArray(list) && list.some((entry) => path.resolve(parent, entry) === __dirname);
  } catch {
    return false;
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(inWorkspace() ? { turbopack: { root: parent } } : {}),
};

module.exports = nextConfig;
