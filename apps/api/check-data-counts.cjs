require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const tables = [
    'Lot',
    'Wallet',
    'WalletTransaction',
    'PurchaseReceipt',
    'BidReservation',
    'AuditEvent',
    'AuditChainState',
  ];

  for (const table of tables) {
    const exists = await client.query('SELECT to_regclass($1) AS name', [
      `public."${table}"`,
    ]);

    if (!exists.rows[0].name) {
      console.log(`${table}: tabela inexistente`);
      continue;
    }

    const result = await client.query(
      `SELECT COUNT(*)::int AS total FROM public."${table}"`,
    );

    console.log(`${table}: ${result.rows[0].total} registro(s)`);
  }

  await client.end();
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
