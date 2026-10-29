import { ConflictException } from '@nestjs/common';
import { BidRejectionException } from './bid-rejection';
import { createHash } from 'crypto';
import { BidsService } from './bids.service';
import { PrismaService } from '../infrastructure/database/prisma.service';

describe('BidsService', () => {
  let service: BidsService;
  let prisma: PrismaService;

  const createRequestHash = (lotId: string, amountCents: number) =>
    createHash('sha256')
      .update(JSON.stringify({ lotId, amountCents }))
      .digest('hex');

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
    } as unknown as PrismaService;

    service = new BidsService(prisma);
  });

  describe('createBid', () => {
    it('deve rejeitar um valor igual a zero', async () => {
      await expect(
        service.createBid('bidder-1', 'lot-1', 0, 'test-key-1'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('deve rejeitar um valor negativo', async () => {
      await expect(
        service.createBid('bidder-1', 'lot-1', -100, 'test-key-2'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('deve rejeitar um valor não inteiro', async () => {
      await expect(
        service.createBid('bidder-1', 'lot-1', 10.5, 'test-key-3'),
      ).rejects.toThrow(ConflictException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('deve rejeitar um lote inexistente', async () => {
      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            $queryRaw: jest.fn().mockResolvedValue([]),
          };

          return callback(tx);
        },
      );

      await expect(
        service.createBid('bidder-1', 'lot-inexistente', 1000, 'test-key-4'),
      ).rejects.toThrow(BidRejectionException);
    });

    it('deve retornar a resposta armazenada ao repetir a mesma requisição', async () => {
      const lotId = 'lot-1';
      const amountCents = 1000;
      const idempotencyKey = 'same-request-key';

      const storedResponse = {
        bid: { id: 'bid-1', lotId, amountCents },
        reservation: { id: 'reservation-1', amountCents },
        currentPriceCents: amountCents,
        availableBalanceCents: 9000,
      };

      const findUnique = jest.fn().mockResolvedValue({
        id: 'request-1',
        bidderId: 'bidder-1',
        lotId,
        idempotencyKey,
        requestHash: createRequestHash(lotId, amountCents),
        bidId: 'bid-1',
        response: storedResponse,
        createdAt: new Date(),
      });

      const create = jest.fn();

      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            $queryRaw: jest.fn().mockResolvedValue([{ id: lotId }]),
            bidRequest: {
              findUnique,
              create,
            },
          };

          return callback(tx);
        },
      );

      const result = await service.createBid(
        'bidder-1',
        lotId,
        amountCents,
        idempotencyKey,
      );

      expect(result).toEqual(storedResponse);

      expect(findUnique).toHaveBeenCalledWith({
        where: {
          bidderId_idempotencyKey: {
            bidderId: 'bidder-1',
            idempotencyKey,
          },
        },
      });

      expect(create).not.toHaveBeenCalled();
    });

    it('deve rejeitar a mesma chave quando o valor do lance for diferente', async () => {
      const lotId = 'lot-1';
      const idempotencyKey = 'reused-key';

      const findUnique = jest.fn().mockResolvedValue({
        id: 'request-1',
        bidderId: 'bidder-1',
        lotId,
        idempotencyKey,
        requestHash: createRequestHash(lotId, 1000),
        bidId: 'bid-1',
        response: {
          bid: { id: 'bid-1' },
          currentPriceCents: 1000,
        },
        createdAt: new Date(),
      });

      const create = jest.fn();

      (prisma.$transaction as jest.Mock).mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            $queryRaw: jest.fn().mockResolvedValue([{ id: lotId }]),
            bidRequest: {
              findUnique,
              create,
            },
          };

          return callback(tx);
        },
      );

      await expect(
        service.createBid('bidder-1', lotId, 1500, idempotencyKey),
      ).rejects.toThrow(ConflictException);

      expect(create).not.toHaveBeenCalled();
    });

    it('deve retornar a resposta criada por uma requisição concorrente', async () => {
      const lotId = 'lot-1';
      const amountCents = 1000;
      const idempotencyKey = 'concurrent-key';

      const storedResponse = {
        bid: { id: 'bid-1', lotId, amountCents },
        reservation: { id: 'reservation-1', amountCents },
        currentPriceCents: amountCents,
        availableBalanceCents: 9000,
      };

      const findUnique = jest.fn().mockResolvedValue({
        lotId,
        requestHash: createRequestHash(lotId, amountCents),
        response: storedResponse,
      });

      (prisma.$transaction as jest.Mock).mockRejectedValue({
        code: 'P2002',
      });

      // Configura o model consultado pelo serviço após o erro de unicidade.
      (prisma as any).bidRequest = {
        findUnique,
      };

      await expect(
        service.createBid('bidder-1', lotId, amountCents, idempotencyKey),
      ).resolves.toEqual(storedResponse);

      expect(findUnique).toHaveBeenCalledWith({
        where: {
          bidderId_idempotencyKey: {
            bidderId: 'bidder-1',
            idempotencyKey,
          },
        },
      });
    });
  });
});
