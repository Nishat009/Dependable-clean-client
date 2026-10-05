const fs = require('node:fs');
const path = require('node:path');

// Inside the combined Dependable-clean folder, packages are hoisted to the parent node_modules,
// so Turbopack needs the parent as its root. Installed on its own, the client keeps its own root.
const parent = path.resolve(__dirname, '..');
const hoisted = fs.existsSync(path.join(parent, 'node_modules', 'next', 'package.json'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(hoisted ? { turbopack: { root: parent } } : {}),
};

module.exports = nextConfig;
