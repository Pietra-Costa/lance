import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { CatalogSource } from '../generated/prisma/enums';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL não foi definida.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const demoUsers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'leiloeiro.demo@lance.local',
          'licitante.demo@lance.local',
          'licitante2.demo@lance.local',
        ],
      },
    },
    select: { id: true },
  });
  const userIds = demoUsers.map(user => user.id);
  const demoItem = await prisma.catalogItem.findUnique({
    where: {
      source_externalId: {
        source: CatalogSource.MET,
        externalId: 'demo-sunflowers',
      },
    },
    select: { id: true },
  });

  const lots = await prisma.lot.findMany({
    where: {
      OR: [
        ...(userIds.length ? [{ sellerId: { in: userIds } }] : []),
        ...(demoItem ? [{ itemSnapshot: { catalogItemId: demoItem.id } }] : []),
      ],
    },
    select: { id: true },
  });
  const lotIds = lots.map(lot => lot.id);
  const bids = lotIds.length
    ? await prisma.bid.findMany({
        where: { lotId: { in: lotIds } },
        select: { id: true },
      })
    : [];
  const bidIds = bids.map(bid => bid.id);
  const settlements = lotIds.length
    ? await prisma.auctionSettlement.findMany({
        where: { lotId: { in: lotIds } },
        select: { id: true },
      })
    : [];
  const settlementIds = settlements.map(settlement => settlement.id);

  await prisma.$transaction(async tx => {
    if (lotIds.length) {
      await tx.outboxEvent.deleteMany({ where: { aggregateId: { in: lotIds } } });
      await tx.auditEvent.deleteMany({ where: { entityId: { in: lotIds } } });
      await tx.bidReservation.deleteMany({ where: { lotId: { in: lotIds } } });
      await tx.bidRequest.deleteMany({ where: { lotId: { in: lotIds } } });
      await tx.receipt.deleteMany({ where: { settlementId: { in: settlementIds } } });
      await tx.auctionSettlement.deleteMany({ where: { lotId: { in: lotIds } } });
      await tx.bid.deleteMany({ where: { lotId: { in: lotIds } } });
      await tx.lotItemSnapshot.deleteMany({ where: { lotId: { in: lotIds } } });
      await tx.lot.deleteMany({ where: { id: { in: lotIds } } });
    }

    if (bidIds.length) {
      await tx.bidRequest.deleteMany({ where: { bidId: { in: bidIds } } });
    }
    if (userIds.length) {
      await tx.walletTransaction.deleteMany({
        where: { wallet: { userId: { in: userIds } } },
      });
      await tx.bidReservation.deleteMany({
        where: { wallet: { userId: { in: userIds } } },
      });
      await tx.sellerAgreement.deleteMany({ where: { userId: { in: userIds } } });
      await tx.notification.deleteMany({ where: { userId: { in: userIds } } });
      await tx.refreshSession.deleteMany({ where: { userId: { in: userIds } } });
      await tx.wallet.deleteMany({ where: { userId: { in: userIds } } });
      await tx.user.deleteMany({ where: { id: { in: userIds } } });
    }

    if (demoItem) {
      await tx.catalogItemImage.deleteMany({ where: { catalogItemId: demoItem.id } });
      await tx.catalogItem.deleteMany({ where: { id: demoItem.id } });
    }
  });

  console.log('Limpeza concluída: dados demonstrativos removidos.');
}

main()
  .catch((error: unknown) => {
    console.error('Falha ao limpar dados demonstrativos:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
