require('dotenv').config();
const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT
        s."lastSequence" AS state_sequence,
        s."lastEventHash" AS state_hash,
        e."sequence" AS event_sequence,
        e."eventHash" AS event_hash
      FROM "AuditChainState" s
      LEFT JOIN "AuditEvent" e
        ON e."sequence" = s."lastSequence"
      WHERE s."id" = 'global';
    `);

    console.log('Conferência da cadeia:', result.rows);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Falha na consulta:', error.message);
  process.exitCode = 1;
});
