import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});
import { createHash } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { UserRole } from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
const demoPassword = process.env.SEED_DEMO_PASSWORD;

if (!connectionString) {
  throw new Error('DATABASE_URL não foi definida.');
}

if (!demoPassword || demoPassword.length < 10) {
  throw new Error(
    'Defina SEED_DEMO_PASSWORD com pelo menos 10 caracteres no .env.',
  );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const leiloeiro = await prisma.user.upsert({
    where: {
      email: 'leiloeiro.demo@lance.local',
    },
    update: {
      name: 'Leiloeiro de Demonstração',
      passwordHash,
      role: UserRole.LEILOEIRO,
    },
    create: {
      name: 'Leiloeiro de Demonstração',
      email: 'leiloeiro.demo@lance.local',
      passwordHash,
      role: UserRole.LEILOEIRO,
    },
  });

  const licitante = await prisma.user.upsert({
    where: {
      email: 'licitante.demo@lance.local',
    },
    update: {
      name: 'Licitante de Demonstração',
      passwordHash,
      role: UserRole.LICITANTE,
    },
    create: {
      name: 'Licitante de Demonstração',
      email: 'licitante.demo@lance.local',
      passwordHash,
      role: UserRole.LICITANTE,
    },
  });

  await prisma.wallet.upsert({
    where: {
      userId: licitante.id,
    },
    update: {},
    create: {
      userId: licitante.id,
      balanceCents: 0,
      reservedCents: 0,
    },
  });

  const demoAgreementContent =
    'LANCE_DEMO_SELLER_AGREEMENT_V1_NOT_A_LEGAL_CONTRACT';

  const contentHash = createHash('sha256')
    .update(demoAgreementContent)
    .digest('hex');

  await prisma.sellerAgreement.upsert({
    where: {
      userId_version: {
        userId: leiloeiro.id,
        version: 'demo-v1',
      },
    },
    update: {},
    create: {
      userId: leiloeiro.id,
      version: 'demo-v1',
      contentHash,
    },
  });

  console.log('Seed concluído.');
  console.log(`Leiloeiro: ${leiloeiro.email}`);
  console.log(`Licitante: ${licitante.email}`);
  console.log('Carteira do licitante criada com saldo zero.');
}

main()
  .catch((error: unknown) => {
    console.error('Falha ao executar o seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
