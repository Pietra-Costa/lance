require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const result = await client.query(`
    SELECT
      to_regclass('"User"') AS user_table,
      to_regclass('"RefreshSession"') AS refresh_session_table
  `);

  console.table(result.rows);
  await client.end();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
