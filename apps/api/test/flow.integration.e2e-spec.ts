import { randomUUID } from 'crypto';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { BidsService } from '../src/bids/bids.service';
import { SettlementsService } from '../src/settlements/settlements.service';
import { LotsService } from '../src/lots/lots.service';
import { AuditService } from '../src/audit/audit.service';
import { BidRejectionException } from '../src/bids/bid-rejection';
import {
  BidReservationStatus,
  LotStatus,
  SettlementStatus,
  UserRole,
} from '../generated/prisma/enums';

/**
 * Testes de integração dos cenários críticos exigidos pelo desafio:
 * - liquidação com vencedor (débito + crédito + recibo)
 * - liquidação sem lances (sem vencedor, sem movimentação financeira)
 * - liquidação repetida (idempotência)
 * - retomada de settlement em PROCESSING (catch-up após interrupção)
 * - cancelamento com reservas ativas (estorno)
 * - adulteração da cadeia de auditoria detectada por /audit/verify
 * - concorrência entre licitantes distintos
 */
describe('Fluxo financeiro (PostgreSQL integration)', () => {
  let prisma: PrismaService;
  let settlements: SettlementsService;
  let lots: LotsService;
  let audit: AuditService;
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

    // Garante que a cadeia de auditoria comece limpa neste banco de teste.
    // Sem isso, dados de execuções anteriores (gravados por versões antigas do
    // código) fazem a verificação falhar por motivo alheio ao teste.
    await prisma.auditEvent.deleteMany();
    await prisma.auditChainState.deleteMany();
    await prisma.auditChainState.create({ data: { id: 'global' } });

    settlements = new SettlementsService(prisma);
    lots = new LotsService(prisma);
    audit = new AuditService(prisma);
    bids = new BidsService(prisma);
  });

  afterEach(async () => {
    if (!prisma) return;

    if (createdLotIds.length > 0) {
      const lotIds = [...createdLotIds];

      await prisma.notification.deleteMany({
        where: { payload: { path: ['lotId'], string_contains: '' } },
      });
      await prisma.bidRequest.deleteMany({ where: { lotId: { in: lotIds } } });
      await prisma.bidReservation.deleteMany({
        where: { lotId: { in: lotIds } },
      });
      await prisma.receipt.deleteMany({
        where: { settlement: { lotId: { in: lotIds } } },
      });
      await prisma.auctionSettlement.deleteMany({
        where: { lotId: { in: lotIds } },
      });
      await prisma.bid.deleteMany({ where: { lotId: { in: lotIds } } });
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

  /**
   * Cria um leiloeiro, dois licitantes com carteira e um lote ao vivo.
   * A janela do lote é controlada por `endsInSeconds` (negativo = já venceu).
   */
  async function createFixture(options?: {
    endsInSeconds?: number;
    balanceCents?: number;
  }) {
    const suffix = randomUUID();
    const now = new Date();
    const endsInSeconds = options?.endsInSeconds ?? 600;
    const balanceCents = options?.balanceCents ?? 100_000;

    const seller = await prisma.user.create({
      data: {
        name: 'Leiloeira Integração',
        email: `seller-${suffix}@integration.test`,
        passwordHash: 'integration-test-hash',
        role: UserRole.LEILOEIRO,
      },
    });

    const bidderA = await prisma.user.create({
      data: {
        name: 'Licitante Alfa',
        email: `alfa-${suffix}@integration.test`,
        passwordHash: 'integration-test-hash',
        role: UserRole.LICITANTE,
      },
    });

    const bidderB = await prisma.user.create({
      data: {
        name: 'Licitante Beta',
        email: `beta-${suffix}@integration.test`,
        passwordHash: 'integration-test-hash',
        role: UserRole.LICITANTE,
      },
    });

    createdUserIds.push(seller.id, bidderA.id, bidderB.id);

    const sellerWallet = await prisma.wallet.create({
      data: { userId: seller.id, balanceCents: 0, reservedCents: 0 },
    });

    const walletA = await prisma.wallet.create({
      data: { userId: bidderA.id, balanceCents, reservedCents: 0 },
    });

    const walletB = await prisma.wallet.create({
      data: { userId: bidderB.id, balanceCents, reservedCents: 0 },
    });

    const lot = await prisma.lot.create({
      data: {
        sellerId: seller.id,
        status: LotStatus.LIVE,
        startingPriceCents: 10_000,
        currentPriceCents: 0,
        minIncrementCents: 1_000,
        startsAt: new Date(now.getTime() - 60_000),
        endsAt: new Date(now.getTime() + endsInSeconds * 1000),
        itemSnapshot: {
          create: {
            title: 'Obra de teste',
            description: 'Snapshot de teste de integração',
          },
        },
      },
    });

    createdLotIds.push(lot.id);

    return {
      seller,
      bidderA,
      bidderB,
      sellerWallet,
      walletA,
      walletB,
      lot,
    };
  }

  const walletOf = (id: string) =>
    prisma.wallet.findUniqueOrThrow({ where: { id } });

  describe('liquidação', () => {
    it('debita o vencedor, credita a leiloeira e emite um recibo', async () => {
      const fixture = await createFixture();

      await bids.createBid(
        fixture.bidderA.id,
        fixture.lot.id,
        10_000,
        `liq-${randomUUID()}`,
      );
      await bids.createBid(
        fixture.bidderB.id,
        fixture.lot.id,
        11_000,
        `liq-${randomUUID()}`,
      );

      // Encerra o lote manualmente (o worker faria isso pelo endsAt).
      await prisma.lot.update({
        where: { id: fixture.lot.id },
        data: { endsAt: new Date(Date.now() - 1_000) },
      });

      const settlement = await settlements.closeAndSettle(fixture.lot.id);

      expect(settlement?.status).toBe(SettlementStatus.COMPLETED);

      const [winnerWallet, sellerWalletAfter, loserWallet, receipt] =
        await Promise.all([
          walletOf(fixture.walletB.id),
          walletOf(fixture.sellerWallet.id),
          walletOf(fixture.walletA.id),
          prisma.receipt.findUnique({
            where: { settlementId: settlement!.id },
          }),
        ]);

      // Vencedor: 100000 - 11000 e nenhuma reserva pendente.
      expect(winnerWallet.balanceCents).toBe(89_000);
      expect(winnerWallet.reservedCents).toBe(0);

      // Leiloeira recebe o valor do arremate.
      expect(sellerWalletAfter.balanceCents).toBe(11_000);

      // Quem foi superado tem o saldo integral de volta.
      expect(loserWallet.balanceCents).toBe(100_000);
      expect(loserWallet.reservedCents).toBe(0);

      expect(receipt).not.toBeNull();
      expect(receipt!.verificationCode).toHaveLength(32);

      const debit = await prisma.walletTransaction.findUnique({
        where: {
          idempotencyKey: `settlement:${settlement!.id}:winner-debit`,
        },
      });
      const credit = await prisma.walletTransaction.findUnique({
        where: {
          idempotencyKey: `settlement:${settlement!.id}:seller-credit`,
        },
      });

      expect(debit?.amountCents).toBe(-11_000);
      expect(credit?.amountCents).toBe(11_000);
    });

    it('encerra lote sem lances sem vencedor e sem movimentação financeira', async () => {
      const fixture = await createFixture({ endsInSeconds: -1 });

      const settlement = await settlements.closeAndSettle(fixture.lot.id);

      expect(settlement?.status).toBe(SettlementStatus.COMPLETED);
      expect(settlement?.winningBidId).toBeNull();

      const [lotAfter, winnerWallet, sellerWalletAfter, receipt] =
        await Promise.all([
          prisma.lot.findUniqueOrThrow({ where: { id: fixture.lot.id } }),
          walletOf(fixture.walletA.id),
          walletOf(fixture.sellerWallet.id),
          prisma.receipt.findFirst({
            where: { settlement: { lotId: fixture.lot.id } },
          }),
        ]);

      expect(lotAfter.status).toBe(LotStatus.ENDED);
      expect(winnerWallet.balanceCents).toBe(100_000);
      expect(sellerWalletAfter.balanceCents).toBe(0);
      expect(receipt).toBeNull();

      const movements = await prisma.walletTransaction.count({
        where: {
          referenceType: 'AUCTION_SETTLEMENT',
          referenceId: settlement!.id,
        },
      });
      expect(movements).toBe(0);

      const noBidsEvent = await prisma.auditEvent.findFirst({
        where: {
          entityId: fixture.lot.id,
          eventType: 'AUCTION_ENDED_NO_BIDS',
        },
      });
      expect(noBidsEvent).not.toBeNull();
    });

    it('não duplica débito, crédito nem recibo ao liquidar duas vezes', async () => {
      const fixture = await createFixture();

      await bids.createBid(
        fixture.bidderA.id,
        fixture.lot.id,
        10_000,
        `idem-${randomUUID()}`,
      );

      await prisma.lot.update({
        where: { id: fixture.lot.id },
        data: { endsAt: new Date(Date.now() - 1_000) },
      });

      const first = await settlements.closeAndSettle(fixture.lot.id);
      const second = await settlements.closeAndSettle(fixture.lot.id);

      expect(second?.id).toBe(first?.id);

      const [winnerWallet, sellerWalletAfter, receipts, movements] =
        await Promise.all([
          walletOf(fixture.walletA.id),
          walletOf(fixture.sellerWallet.id),
          prisma.receipt.count({ where: { settlementId: first!.id } }),
          prisma.walletTransaction.count({
            where: {
              referenceType: 'AUCTION_SETTLEMENT',
              referenceId: first!.id,
            },
          }),
        ]);

      expect(winnerWallet.balanceCents).toBe(90_000);
      expect(sellerWalletAfter.balanceCents).toBe(10_000);
      expect(receipts).toBe(1);
      expect(movements).toBe(2);
    });

    it('retoma um settlement que ficou em PROCESSING após interrupção', async () => {
      const fixture = await createFixture();

      await bids.createBid(
        fixture.bidderA.id,
        fixture.lot.id,
        10_000,
        `catchup-${randomUUID()}`,
      );

      await prisma.lot.update({
        where: { id: fixture.lot.id },
        data: { endsAt: new Date(Date.now() - 1_000) },
      });

      // Simula um processo interrompido no meio da liquidação:
      // o lote está ENDED e o settlement ficou preso em PROCESSING.
      await prisma.lot.update({
        where: { id: fixture.lot.id },
        data: { status: LotStatus.ENDED },
      });

      const stuck = await prisma.auctionSettlement.create({
        data: {
          lotId: fixture.lot.id,
          amountCents: 10_000,
          status: SettlementStatus.PROCESSING,
        },
      });

      const resumed = await settlements.closeAndSettle(fixture.lot.id);

      expect(resumed?.id).toBe(stuck.id);
      expect(resumed?.status).toBe(SettlementStatus.COMPLETED);

      const winnerWallet = await walletOf(fixture.walletA.id);
      expect(winnerWallet.balanceCents).toBe(90_000);
      expect(winnerWallet.reservedCents).toBe(0);
    });

    it('marca o settlement como FAILED quando a reserva do vencedor desapareceu', async () => {
      const fixture = await createFixture();

      await bids.createBid(
        fixture.bidderA.id,
        fixture.lot.id,
        10_000,
        `failed-${randomUUID()}`,
      );

      // Corrompe propositalmente o estado: remove a reserva ativa.
      await prisma.bidReservation.deleteMany({
        where: { lotId: fixture.lot.id },
      });

      await prisma.lot.update({
        where: { id: fixture.lot.id },
        data: { endsAt: new Date(Date.now() - 1_000) },
      });

      await expect(
        settlements.closeAndSettle(fixture.lot.id),
      ).rejects.toThrow();

      const settlement = await prisma.auctionSettlement.findUniqueOrThrow({
        where: { lotId: fixture.lot.id },
      });

      expect(settlement.status).toBe(SettlementStatus.FAILED);

      // Nenhum saldo foi criado ou destruído.
      const [winnerWallet, sellerWalletAfter] = await Promise.all([
        walletOf(fixture.walletA.id),
        walletOf(fixture.sellerWallet.id),
      ]);
      expect(winnerWallet.balanceCents).toBe(100_000);
      expect(sellerWalletAfter.balanceCents).toBe(0);
    });
  });

  describe('cancelamento', () => {
    it('libera a reserva ativa e impede liquidação posterior', async () => {
      const fixture = await createFixture();

      await bids.createBid(
        fixture.bidderA.id,
        fixture.lot.id,
        10_000,
        `cancel-${randomUUID()}`,
      );

      const beforeCancel = await walletOf(fixture.walletA.id);
      expect(beforeCancel.reservedCents).toBe(10_000);

      await lots.cancel(fixture.seller.id, fixture.lot.id, {
        reason: 'Item retirado pelo consignante',
      });

      const [lotAfter, walletAfter] = await Promise.all([
        prisma.lot.findUniqueOrThrow({ where: { id: fixture.lot.id } }),
        walletOf(fixture.walletA.id),
      ]);

      expect(lotAfter.status).toBe(LotStatus.CANCELED);
      expect(walletAfter.reservedCents).toBe(0);
      expect(walletAfter.balanceCents).toBe(100_000);

      const settlement = await settlements.closeAndSettle(fixture.lot.id);
      expect(settlement).toBeNull();

      const settlementsCount = await prisma.auctionSettlement.count({
        where: { lotId: fixture.lot.id },
      });
      expect(settlementsCount).toBe(0);
    });
  });

  describe('concorrência', () => {
    it('aceita apenas um lance quando dois licitantes disputam ao mesmo tempo', async () => {
      const fixture = await createFixture();

      const results = await Promise.allSettled([
        bids.createBid(
          fixture.bidderA.id,
          fixture.lot.id,
          10_000,
          `race-a-${randomUUID()}`,
        ),
        bids.createBid(
          fixture.bidderB.id,
          fixture.lot.id,
          10_000,
          `race-b-${randomUUID()}`,
        ),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      expect(fulfilled.length).toBe(1);

      const [bidsCount, activeReservations, lotAfter] = await Promise.all([
        prisma.bid.count({ where: { lotId: fixture.lot.id } }),
        prisma.bidReservation.count({
          where: { lotId: fixture.lot.id, status: BidReservationStatus.ACTIVE },
        }),
        prisma.lot.findUniqueOrThrow({ where: { id: fixture.lot.id } }),
      ]);

      expect(bidsCount).toBe(1);
      expect(activeReservations).toBe(1);
      expect(lotAfter.currentPriceCents).toBe(10_000);
      expect(lotAfter.currentLeaderId).not.toBeNull();
    });

    it('recusa o líder cobrindo o próprio lance', async () => {
      const fixture = await createFixture();

      await bids.createBid(
        fixture.bidderA.id,
        fixture.lot.id,
        10_000,
        `self-${randomUUID()}`,
      );

      await expect(
        bids.createBid(
          fixture.bidderA.id,
          fixture.lot.id,
          11_000,
          `self2-${randomUUID()}`,
        ),
      ).rejects.toThrow(BidRejectionException);

      const wallet = await walletOf(fixture.walletA.id);
      expect(wallet.reservedCents).toBe(10_000);
    });
  });

  describe('auditoria', () => {
    it('detecta adulteração direta no banco', async () => {
      const fixture = await createFixture();

      await bids.createBid(
        fixture.bidderA.id,
        fixture.lot.id,
        10_000,
        `audit-${randomUUID()}`,
      );

      const intact = await audit.verify();
      expect(intact.valid).toBe(true);

      // Adultera o payload de um evento diretamente no banco, sem recalcular
      // o hash — exatamente o ataque que a cadeia deve detectar.
      const target = await prisma.auditEvent.findFirstOrThrow({
        where: { entityId: fixture.lot.id, eventType: 'BID_PLACED' },
      });

      await prisma.auditEvent.update({
        where: { id: target.id },
        data: {
          payload: {
            ...(target.payload as Record<string, unknown>),
            amountCents: 1,
          },
        },
      });

      const tampered = await audit.verify();
      expect(tampered.valid).toBe(false);
      expect(tampered.invalidSequence).toBe(target.sequence.toString());
    });

    it('detecta remoção de um evento da cadeia', async () => {
      const fixture = await createFixture();

      await bids.createBid(
        fixture.bidderA.id,
        fixture.lot.id,
        10_000,
        `audit-del-${randomUUID()}`,
      );

      const target = await prisma.auditEvent.findFirstOrThrow({
        where: { entityId: fixture.lot.id, eventType: 'BID_PLACED' },
      });

      await prisma.auditEvent.delete({ where: { id: target.id } });

      const result = await audit.verify();
      expect(result.valid).toBe(false);
    });
  });
});
