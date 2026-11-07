// npm run package: writes dependable-clean.zip from the committed files only (git archive HEAD).
// It needs git and a checkout with at least one commit; without them it explains what to do instead of failing with a git error.
const { execFileSync } = require('node:child_process');

function git(args) {
  return execFileSync('git', args, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
}

try {
  git(['rev-parse', '--verify', 'HEAD']);
} catch {
  console.error([
    'npm run package needs git and a git checkout with at least one commit (it zips the committed files with git archive).',
    'In a folder from a downloaded ZIP, run: git init && git add -A && git commit -m "Import"',
    'or zip the folder yourself without node_modules, frontend/.next, backend/.env and frontend/.env.local.'
  ].join('\n'));
  process.exit(1);
}

if (git(['status', '--porcelain', '--untracked-files=no'])) {
  console.warn('Note: uncommitted changes are not included. Commit them first to package them.');
}
git(['archive', '--format=zip', '-o', 'dependable-clean.zip', 'HEAD']);
console.log('Wrote dependable-clean.zip from ' + git(['rev-parse', '--short', 'HEAD']) + '.');
