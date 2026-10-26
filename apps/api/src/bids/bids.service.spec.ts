import { ConflictException, NotFoundException } from '@nestjs/common';
import { BidsService } from './bids.service';
import { PrismaService } from '../infrastructure/database/prisma.service';

describe('BidsService', () => {
  let service: BidsService;
  let prisma: {
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
    };

    service = new BidsService(prisma as unknown as PrismaService);
  });

  it('rejeita um valor de lance igual a zero', async () => {
    await expect(service.createBid('bidder-1', 'lot-1', 0)).rejects.toThrow(
      ConflictException,
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita um valor de lance negativo', async () => {
    await expect(service.createBid('bidder-1', 'lot-1', -100)).rejects.toThrow(
      ConflictException,
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejeita um valor que não seja inteiro', async () => {
    await expect(service.createBid('bidder-1', 'lot-1', 10.5)).rejects.toThrow(
      ConflictException,
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('retorna erro quando o lote não existe', async () => {
    prisma.$transaction.mockImplementation(
      async (callback: (tx: unknown) => Promise<unknown>) =>
        callback({
          $queryRaw: jest.fn().mockResolvedValue([]),
        }),
    );

    await expect(
      service.createBid('bidder-1', 'lot-inexistente', 1000),
    ).rejects.toThrow(NotFoundException);
  });
});
