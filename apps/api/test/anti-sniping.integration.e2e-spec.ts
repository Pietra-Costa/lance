import { randomUUID } from 'crypto';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { BidsService } from '../src/bids/bids.service';
import { LotStatus, UserRole } from '../generated/prisma/enums';

/**
 * Anti-sniping (extensão de prazo).
 *
 * Regra implementada em `BidsService.createBid`: quando um lance entra nos
 * últimos 2 minutos, o `endsAt` do lote passa a ser `instante do lance + 2 min`.
 * Nunca encurta o prazo.
 *
 * Cenários cobertos:
 *  1. Lance nos últimos 2 min estende o prazo para agora + 2 min.
 *  2. Lance fora da janela não altera o prazo.
 *  3. Lance muito perto do fim (ex.: 10s) recebe a janela inteira (não 10s).
 *  4. Dois lances em sequência dentro da janela: cada um renova para agora + 2 min.
 *  5. A extensão é refletida no evento de auditoria (payload `endsAt`).
 */
describe('Anti-sniping (extensão de prazo)', () => {
  let prisma: PrismaService;
  let bids: BidsService;

  const createdLotIds: string[] = [];
  const createdUserIds: string[] = [];

  jest.setTimeout(60_000);

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL não definida.');
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

    await prisma.auditEvent.deleteMany();
    await prisma.auditChainState.deleteMany();
    await prisma.auditChainState.create({ data: { id: 'global' } });

    bids = new BidsService(prisma);
  });

  afterEach(async () => {
    if (!prisma) return;

    if (createdLotIds.length > 0) {
      const lotIds = [...createdLotIds];

      // Ordem importa: BidReservation referencia Bid por FK.
      await prisma.bidReservation.deleteMany({ where: { lotId: { in: lotIds } } });
      await prisma.notification.deleteMany({
        where: { payload: { path: ['lotId'], string_contains: '' } },
      });
      // BidRequest também aponta para Bid (FK), então sai antes.
      await prisma.bidRequest.deleteMany({ where: { lotId: { in: lotIds } } });
      await prisma.bid.deleteMany({ where: { lotId: { in: lotIds } } });
      await prisma.outboxEvent.deleteMany({});
      await prisma.lotItemSnapshot.deleteMany({
        where: { lotId: { in: lotIds } },
      });
      await prisma.lot.deleteMany({ where: { id: { in: lotIds } } });

      createdLotIds.length = 0;
    }

    if (createdUserIds.length > 0) {
      const userIds = [...createdUserIds];

      await prisma.walletTransaction.deleteMany({
        where: { wallet: { userId: { in: userIds } } },
      });
      await prisma.bidReservation.deleteMany({
        where: { wallet: { userId: { in: userIds } } },
      });
      await prisma.notification.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.wallet.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });

      createdUserIds.length = 0;
    }
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  /** Cria um lote LIVE terminando em `endsInMs` e um licitante com saldo. */
  async function createLot(endsInMs: number) {
    const suffix = randomUUID();
    const now = new Date();

    const seller = await prisma.user.create({
      data: {
        name: 'Leiloeira Anti-sniping',
        email: `sniping-seller-${suffix}@integration.test`,
        passwordHash: 'integration-test-hash',
        role: UserRole.LEILOEIRO,
      },
    });

    const bidder = await prisma.user.create({
      data: {
        name: 'Licitante Anti-sniping',
        email: `sniping-bidder-${suffix}@integration.test`,
        passwordHash: 'integration-test-hash',
        role: UserRole.LICITANTE,
      },
    });

    createdUserIds.push(seller.id, bidder.id);

    await prisma.wallet.create({
      data: { userId: seller.id, balanceCents: 0, reservedCents: 0 },
    });

    const wallet = await prisma.wallet.create({
      data: { userId: bidder.id, balanceCents: 100_000, reservedCents: 0 },
    });

    const lot = await prisma.lot.create({
      data: {
        sellerId: seller.id,
        status: LotStatus.LIVE,
        startingPriceCents: 10_000,
        currentPriceCents: 0,
        minIncrementCents: 1_000,
        startsAt: new Date(now.getTime() - 60_000),
        endsAt: new Date(now.getTime() + endsInMs),
        itemSnapshot: {
          create: {
            title: 'Obra anti-sniping',
            description: 'Snapshot do teste de anti-sniping',
          },
        },
      },
    });

    createdLotIds.push(lot.id);

    return { lot, bidder, wallet };
  }

  const readEndsAt = async (lotId: string) =>
    (await prisma.lot.findUniqueOrThrow({ where: { id: lotId } })).endsAt;

  /** Tolerância de relógio: o lance e a leitura não são instantâneos. */
  const TWO_MINUTES = 120_000;
  const TOLERANCE = 5_000;

  it('estende o prazo para agora + 2 min quando o lance entra nos últimos 2 min', async () => {
    const { lot, bidder } = await createLot(60_000); // falta 1 min

    const before = await readEndsAt(lot.id);

    await bids.createBid(bidder.id, lot.id, 10_000, `sniping-${randomUUID()}`);

    const after = await readEndsAt(lot.id);
    const expected = Date.now() + TWO_MINUTES;

    expect(after.getTime()).toBeGreaterThan(before.getTime());
    expect(Math.abs(after.getTime() - expected)).toBeLessThanOrEqual(TOLERANCE);
  });

  it('não altera o prazo quando o lance entra fora da janela', async () => {
    const { lot, bidder } = await createLot(10 * 60_000); // falta 10 min

    const before = await readEndsAt(lot.id);

    await bids.createBid(bidder.id, lot.id, 10_000, `sniping-${randomUUID()}`);

    const after = await readEndsAt(lot.id);

    expect(after.getTime()).toBe(before.getTime());
  });

  it('aplica a janela inteira de 2 min, mesmo faltando 10 segundos', async () => {
    const { lot, bidder } = await createLot(10_000);

    await bids.createBid(bidder.id, lot.id, 10_000, `sniping-${randomUUID()}`);

    const after = await readEndsAt(lot.id);
    const expected = Date.now() + TWO_MINUTES;

    // Não é "fim + 2 min" (que daria ~2min10s) nem "agora + 10s".
    expect(Math.abs(after.getTime() - expected)).toBeLessThanOrEqual(TOLERANCE);
  });

  it('renova o prazo a cada lance dentro da janela', async () => {
    const { lot, bidder } = await createLot(30_000);

    await bids.createBid(bidder.id, lot.id, 10_000, `sniping-${randomUUID()}`);
    const first = await readEndsAt(lot.id);

    // Segundo lance 300 ms depois (o líder pode ser superado por simulação:
    // o mesmo licitante não pode cobrir o próprio lance, então usamos outro).
    const second = await prisma.user.create({
      data: {
        name: 'Licitante Anti-sniping 2',
        email: `sniping-bidder2-${randomUUID()}@integration.test`,
        passwordHash: 'integration-test-hash',
        role: UserRole.LICITANTE,
      },
    });

    createdUserIds.push(second.id);

    await prisma.wallet.create({
      data: { userId: second.id, balanceCents: 100_000, reservedCents: 0 },
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    await bids.createBid(second.id, lot.id, 11_000, `sniping-${randomUUID()}`);

    const after = await readEndsAt(lot.id);

    expect(after.getTime()).toBeGreaterThan(first.getTime());
    expect(
      Math.abs(after.getTime() - (Date.now() + TWO_MINUTES)),
    ).toBeLessThanOrEqual(TOLERANCE);
  });

  it('registra o novo prazo no evento de auditoria do lance', async () => {
    const { lot, bidder } = await createLot(45_000);

    await bids.createBid(bidder.id, lot.id, 10_000, `sniping-${randomUUID()}`);

    const event = await prisma.auditEvent.findFirst({
      where: { eventType: 'BID_PLACED', entityId: lot.id },
      orderBy: { sequence: 'desc' },
    });

    expect(event).not.toBeNull();

    const payload = event?.payload as { endsAt?: string } | null;
    const endsAt = await readEndsAt(lot.id);

    expect(payload?.endsAt).toBeDefined();
    expect(new Date(payload!.endsAt!).getTime()).toBe(endsAt.getTime());
  });
});
