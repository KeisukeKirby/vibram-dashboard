// Runs `prisma db push` against DB_SCHEMA (if set), preferring the unpooled URL.
const { spawnSync } = require('node:child_process');
const { withSchema } = require('./dbUrl.cjs');

const base = process.env.DB_SCHEMA
  ? process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
  : process.env.DATABASE_URL;
const env = { ...process.env, DATABASE_URL: withSchema(base) };

const res = spawnSync('npx', ['prisma', 'db', 'push', '--skip-generate'], { stdio: 'inherit', env });
process.exit(res.status ?? 1);
