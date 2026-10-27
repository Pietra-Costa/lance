import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL ausente; testes de integração cancelados.');
}

const parsedUrl = new URL(databaseUrl);

if (
  parsedUrl.hostname !== 'localhost' ||
  parsedUrl.port !== '5432' ||
  parsedUrl.pathname.replace(/^\//, '') !== 'lance'
) {
  throw new Error(
    'O .env deve apontar para localhost:5432/lance antes de configurar o banco de teste.',
  );
}

parsedUrl.pathname = '/lance_test';
process.env.DATABASE_URL = parsedUrl.toString();
