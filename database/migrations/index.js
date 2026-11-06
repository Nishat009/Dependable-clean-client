// Runs every migration in order. Each one is safe to rerun, so the whole list runs every time.
const migrations = [
  ['001-initial-schema', require('./001-initial-schema')],
  ['002-indexes-and-validators', require('./002-indexes-and-validators')]
];

// Every collection with the indexes all migrations together create.
const collections = {};
for (const [, migration] of migrations) {
  for (const [name, indexes] of Object.entries(migration.collections)) collections[name] = [...(collections[name] || []), ...indexes];
}

async function upAll(db, log = console.log) {
  for (const [name, migration] of migrations) {
    log(`-- ${name}`);
    await migration.up(db, log);
  }
}

module.exports = { migrations, collections, upAll };
