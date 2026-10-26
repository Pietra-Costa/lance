import { ConflictException, NotFoundException } from '@nestjs/common';
import { BidsService } from './bids.service';
import { PrismaService } from '../infrastructure/database/prisma.service';

describe('BidsService', () => {
  let service: BidsService;
  let prisma: PrismaService;

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
      ).rejects.toThrow(NotFoundException);
    });
  });
});
