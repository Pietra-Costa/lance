import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});
import { createHash } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import {
  BidReservationStatus,
  CatalogSource,
  LotStatus,
  UserRole,
  WalletTransactionType,
} from '../generated/prisma/client';

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

  const segundoLicitante = await prisma.user.upsert({
    where: { email: 'licitante2.demo@lance.local' },
    update: { name: 'Segundo Licitante de Demonstração', passwordHash, role: UserRole.LICITANTE },
    create: { name: 'Segundo Licitante de Demonstração', email: 'licitante2.demo@lance.local', passwordHash, role: UserRole.LICITANTE },
  });

  await prisma.wallet.upsert({
    where: {
      userId: licitante.id,
    },
    update: { balanceCents: 200_000 },
    create: {
      userId: licitante.id,
      balanceCents: 200_000,
      reservedCents: 0,
    },
  });
  const segundoWallet = await prisma.wallet.upsert({
    where: { userId: segundoLicitante.id },
    update: { balanceCents: 200_000 },
    create: { userId: segundoLicitante.id, balanceCents: 200_000, reservedCents: 0 },
  });
  await prisma.wallet.upsert({ where: { userId: leiloeiro.id }, update: {}, create: { userId: leiloeiro.id } });

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

  const catalogItem = await prisma.catalogItem.upsert({
    where: { source_externalId: { source: CatalogSource.MET, externalId: 'demo-sunflowers' } },
    update: {},
    create: { source: CatalogSource.MET, externalId: 'demo-sunflowers', title: 'Girassóis - item de demonstração', description: 'Item fictício para percorrer o fluxo de leilão.', creator: 'Lance Demo', sourceUrl: 'https://example.test/catalog/demo-sunflowers', attributes: { demo: true } },
  });
  const existingLot = await prisma.lot.findFirst({ where: { sellerId: leiloeiro.id, itemSnapshot: { catalogItemId: catalogItem.id } } });
  if (!existingLot) {
    const now = new Date();
    const lot = await prisma.lot.create({
      data: {
        sellerId: leiloeiro.id,
        currentLeaderId: segundoLicitante.id,
        status: LotStatus.LIVE,
        startingPriceCents: 10_000,
        currentPriceCents: 16_000,
        minIncrementCents: 1_000,
        startsAt: new Date(now.getTime() - 60 * 60 * 1000),
        endsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        itemSnapshot: { create: { catalogItemId: catalogItem.id, title: catalogItem.title, description: catalogItem.description, source: catalogItem.source, externalId: catalogItem.externalId, attributes: catalogItem.attributes ?? undefined, sourceUrl: catalogItem.sourceUrl } },
      },
    });
    await prisma.bid.createMany({ data: [
      { lotId: lot.id, bidderId: licitante.id, amountCents: 10_000 },
      { lotId: lot.id, bidderId: segundoLicitante.id, amountCents: 16_000 },
    ] });
    const winningBid = await prisma.bid.findFirstOrThrow({ where: { lotId: lot.id, bidderId: segundoLicitante.id }, orderBy: { amountCents: 'desc' } });
    await prisma.bidReservation.create({ data: { walletId: segundoWallet.id, lotId: lot.id, bidId: winningBid.id, amountCents: 16_000, status: BidReservationStatus.ACTIVE } });
    await prisma.wallet.update({ where: { id: segundoWallet.id }, data: { reservedCents: 16_000 } });
  }

  const wallets = await prisma.wallet.findMany({ where: { userId: { in: [licitante.id, segundoLicitante.id] } } });
  for (const wallet of wallets) {
    await prisma.walletTransaction.upsert({
      where: { idempotencyKey: `seed-deposit:${wallet.userId}` },
      update: {},
      create: { walletId: wallet.id, type: WalletTransactionType.DEPOSIT, amountCents: 200_000, idempotencyKey: `seed-deposit:${wallet.userId}`, referenceType: 'SEED', referenceId: wallet.userId, description: 'Saldo demonstrativo' },
    });
  }

  console.log('Seed concluído.');
  console.log(`Leiloeiro: ${leiloeiro.email}`);
  console.log(`Licitante: ${licitante.email}`);
  console.log(`Licitantes: ${licitante.email} e ${segundoLicitante.email}`);
  console.log('Duas carteiras com saldo e um lote ao vivo com lances foram preparados.');
}

main()
  .catch((error: unknown) => {
    console.error('Falha ao executar o seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
