import { randomUUID } from 'crypto';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { BidsService } from '../src/bids/bids.service';
import { LotStatus, UserRole } from '../generated/prisma/enums';

type BidResponse = {
  bid: {
    id: string;
    createdAt: Date;
    bidderId: string;
    lotId: string;
    amountCents: number;
  };
  reservation: {
    id: string;
  };
  currentPriceCents: number;
  availableBalanceCents: number;
};

describe('BidsService (PostgreSQL integration)', () => {
  let prisma: PrismaService;
  let service: BidsService;

  const createdLotIds: string[] = [];
  const createdUserIds: string[] = [];

  jest.setTimeout(30_000);

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL não definida. Testes de integração cancelados.',
      );
    }

    const parsedUrl = new URL(databaseUrl);

    if (
      parsedUrl.hostname !== 'localhost' ||
      parsedUrl.port !== '5432' ||
      parsedUrl.pathname.replace(/^\//, '') !== 'lance_test'
    ) {
      throw new Error(
        'Segurança: os testes exigem localhost:5432/lance_test. Nenhum teste foi iniciado.',
      );
    }

    prisma = new PrismaService();
    await prisma.$connect();

    service = new BidsService(prisma);
  });

  afterEach(async () => {
    if (!prisma) return;

    if (createdLotIds.length > 0) {
      const lotIds = [...createdLotIds];

      await prisma.bidRequest.deleteMany({
        where: { lotId: { in: lotIds } },
      });

      await prisma.bidReservation.deleteMany({
        where: { lotId: { in: lotIds } },
      });

      await prisma.bid.deleteMany({
        where: { lotId: { in: lotIds } },
      });

      await prisma.lot.deleteMany({
        where: { id: { in: lotIds } },
      });

      createdLotIds.length = 0;
    }

    if (createdUserIds.length > 0) {
      const userIds = [...createdUserIds];

      await prisma.wallet.deleteMany({
        where: { userId: { in: userIds } },
      });

      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });

      createdUserIds.length = 0;
    }
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  async function createFixture(options?: { secondsToEnd?: number }) {
    const suffix = randomUUID();
    const now = new Date();

    const seller = await prisma.user.create({
      data: {
        name: 'Integration Seller',
        email: `seller-${suffix}@integration.test`,
        passwordHash: 'integration-test-hash',
        role: UserRole.LEILOEIRO,
      },
    });

    createdUserIds.push(seller.id);

    const bidder = await prisma.user.create({
      data: {
        name: 'Integration Bidder',
        email: `bidder-${suffix}@integration.test`,
        passwordHash: 'integration-test-hash',
        role: UserRole.LICITANTE,
      },
    });

    createdUserIds.push(bidder.id);

    const wallet = await prisma.wallet.create({
      data: {
        userId: bidder.id,
        balanceCents: 100_000,
        reservedCents: 0,
      },
    });

    const lot = await prisma.lot.create({
      data: {
        sellerId: seller.id,
        status: LotStatus.LIVE,
        startingPriceCents: 1000,
        currentPriceCents: 0,
        minIncrementCents: 100,
        startsAt: new Date(now.getTime() - 60_000),
        endsAt: new Date(now.getTime() + (options?.secondsToEnd ?? 600) * 1000),
      },
    });

    createdLotIds.push(lot.id);

    return { seller, bidder, wallet, lot };
  }

  it('registra o lance, reserva o saldo e persiste auditoria e outbox', async () => {
    const { bidder, wallet, lot } = await createFixture();

    const result = (await service.createBid(
      bidder.id,
      lot.id,
      1000,
      `bid-${randomUUID()}`,
    )) as BidResponse;

    const [savedLot, savedWallet, reservations, bids, audit, outbox] =
      await Promise.all([
        prisma.lot.findUniqueOrThrow({
          where: { id: lot.id },
        }),
        prisma.wallet.findUniqueOrThrow({
          where: { id: wallet.id },
        }),
        prisma.bidReservation.findMany({
          where: { lotId: lot.id, status: 'ACTIVE' },
        }),
        prisma.bid.findMany({
          where: { lotId: lot.id },
        }),
        prisma.auditEvent.findMany({
          where: {
            entityType: 'LOT',
            entityId: lot.id,
            eventType: 'BID_PLACED',
          },
        }),
        prisma.outboxEvent.findMany({
          where: {
            aggregateId: lot.id,
            eventType: 'BID_PLACED',
          },
        }),
      ]);

    expect(result.bid.id).toBe(bids[0].id);
    expect(savedLot.currentLeaderId).toBe(bidder.id);
    expect(savedLot.currentPriceCents).toBe(1000);
    expect(savedWallet.reservedCents).toBe(1000);
    expect(reservations).toHaveLength(1);
    expect(reservations[0].amountCents).toBe(1000);
    expect(bids).toHaveLength(1);
    expect(audit).toHaveLength(1);
    expect(outbox).toHaveLength(1);
  });

  it('retorna o resultado original ao repetir a mesma chave idempotente', async () => {
    const { bidder, wallet, lot } = await createFixture();
    const key = `idempotency-${randomUUID()}`;

    const first = (await service.createBid(
      bidder.id,
      lot.id,
      1000,
      key,
    )) as BidResponse;

    const second = (await service.createBid(
      bidder.id,
      lot.id,
      1000,
      key,
    )) as BidResponse;

    const [bids, reservations, savedWallet] = await Promise.all([
      prisma.bid.findMany({ where: { lotId: lot.id } }),
      prisma.bidReservation.findMany({
        where: { lotId: lot.id, status: 'ACTIVE' },
      }),
      prisma.wallet.findUniqueOrThrow({
        where: { id: wallet.id },
      }),
    ]);

    expect(second.bid.id).toBe(first.bid.id);
    expect(second.reservation.id).toBe(first.reservation.id);
    expect(bids).toHaveLength(1);
    expect(reservations).toHaveLength(1);
    expect(savedWallet.reservedCents).toBe(1000);
  });

  it('prorroga o encerramento quando o lance ocorre nos últimos dois minutos', async () => {
    const { bidder, lot } = await createFixture({
      secondsToEnd: 90,
    });

    const previousEnd = lot.endsAt;

    await service.createBid(
      bidder.id,
      lot.id,
      1000,
      `anti-sniping-${randomUUID()}`,
    );

    const updatedLot = await prisma.lot.findUniqueOrThrow({
      where: { id: lot.id },
    });

    expect(updatedLot.endsAt.getTime()).toBeGreaterThan(previousEnd.getTime());

    // O serviço define o encerramento como o instante do lance + 120 segundos.
    expect(
      Math.abs(updatedLot.endsAt.getTime() - (Date.now() + 120_000)),
    ).toBeLessThan(5000);
  });

  it('não cria dois lances quando a mesma requisição chega simultaneamente', async () => {
    const { bidder, wallet, lot } = await createFixture();
    const key = `concurrent-${randomUUID()}`;

    const results = (await Promise.all([
      service.createBid(bidder.id, lot.id, 1000, key),
      service.createBid(bidder.id, lot.id, 1000, key),
    ])) as BidResponse[];

    const [bids, reservations, savedWallet] = await Promise.all([
      prisma.bid.findMany({ where: { lotId: lot.id } }),
      prisma.bidReservation.findMany({
        where: { lotId: lot.id, status: 'ACTIVE' },
      }),
      prisma.wallet.findUniqueOrThrow({
        where: { id: wallet.id },
      }),
    ]);

    expect(results[0].bid.id).toBe(results[1].bid.id);
    expect(bids).toHaveLength(1);
    expect(reservations).toHaveLength(1);
    expect(savedWallet.reservedCents).toBe(1000);
  });
});
