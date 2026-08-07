// Local dev-only Postgres: no Docker/system Postgres is available on this
// machine, so this spawns a self-contained Postgres cluster (via the
// embedded-postgres npm package) matching DATABASE_URL in .env. Not for
// production use — see WORKFLOW.md M0, which assumes Docker Compose instead.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import EmbeddedPostgres from 'embedded-postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseDir = path.join(__dirname, '..', '.pgdata');

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'testsphere',
  password: 'testsphere',
  port: 5432,
  persistent: true,
});

async function start() {
  // initialise() unconditionally runs initdb, which fails once databaseDir
  // is populated — only run it the first time this cluster is created.
  if (!existsSync(path.join(databaseDir, 'PG_VERSION'))) {
    await pg.initialise();
  }
  await pg.start();
  try {
    await pg.createDatabase('testsphere');
  } catch {
    // already exists
  }
  console.log('Postgres ready on localhost:5432 (db: testsphere)');
}

async function stop() {
  await pg.initialise();
  await pg.stop();
  console.log('Postgres stopped');
}

const command = process.argv[2];
if (command === 'stop') {
  stop().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  start().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
