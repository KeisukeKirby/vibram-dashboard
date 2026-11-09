// When DB_SCHEMA is set, point Prisma at that Postgres schema so this app's
// tables live apart from anything else in a shared database.
function withSchema(url) {
  const schema = process.env.DB_SCHEMA;
  if (!url || !schema) return url;
  const u = new URL(url);
  u.searchParams.set('schema', schema);
  return u.toString();
}

module.exports = { withSchema };
