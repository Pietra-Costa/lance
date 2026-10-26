import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { WalletService } from './wallet.service';
import { WalletTransactionType } from '../../generated/prisma/enums';

describe('WalletService', () => {
  let service: WalletService;
  let prisma: {
    $transaction: jest.Mock;
    walletTransaction: {
      findUnique: jest.Mock;
    };
  };

  let tx: {
    walletTransaction: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    wallet: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const userId = 'user-1';
  const idempotencyKey = 'deposit-001';

  beforeEach(() => {
    tx = {
      walletTransaction: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      wallet: {
        findUnique: jest.fn().mockResolvedValue({ id: 'wallet-1' }),
        update: jest.fn().mockResolvedValue({ balanceCents: 5000 }),
      },
    };

    prisma = {
      $transaction: jest.fn((callback) => callback(tx)),
      walletTransaction: {
        findUnique: jest.fn(),
      },
    };

    service = new WalletService(prisma as unknown as PrismaService);
  });

  it('credits the wallet and creates a deposit ledger entry', async () => {
    tx.walletTransaction.create.mockResolvedValue({
      id: 'transaction-1',
      type: WalletTransactionType.DEPOSIT,
      amountCents: 5000,
      idempotencyKey,
      referenceType: 'SIMULATED_DEPOSIT',
      referenceId: idempotencyKey,
      createdAt: new Date(),
    });

    const result = await service.createDeposit(userId, 5000, idempotencyKey);

    expect(tx.wallet.update).toHaveBeenCalledWith({
      where: { id: 'wallet-1' },
      data: { balanceCents: { increment: 5000 } },
      select: { balanceCents: true },
    });

    expect(tx.walletTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          walletId: 'wallet-1',
          type: WalletTransactionType.DEPOSIT,
          amountCents: 5000,
          idempotencyKey,
        }),
      }),
    );

    expect(result.balanceCents).toBe(5000);
    expect(result.idempotentReplay).toBe(false);
  });

  it('does not credit again when the same deposit is repeated', async () => {
    tx.walletTransaction.findUnique.mockResolvedValue({
      id: 'transaction-1',
      type: WalletTransactionType.DEPOSIT,
      amountCents: 5000,
      idempotencyKey,
      referenceType: 'SIMULATED_DEPOSIT',
      referenceId: idempotencyKey,
      createdAt: new Date(),
      wallet: {
        userId,
        balanceCents: 5000,
      },
    });

    const result = await service.createDeposit(userId, 5000, idempotencyKey);

    expect(result.idempotentReplay).toBe(true);
    expect(tx.wallet.update).not.toHaveBeenCalled();
    expect(tx.walletTransaction.create).not.toHaveBeenCalled();
  });

  it('rejects reuse of the same key with a different amount', async () => {
    tx.walletTransaction.findUnique.mockResolvedValue({
      id: 'transaction-1',
      type: WalletTransactionType.DEPOSIT,
      amountCents: 5000,
      idempotencyKey,
      referenceType: 'SIMULATED_DEPOSIT',
      referenceId: idempotencyKey,
      createdAt: new Date(),
      wallet: {
        userId,
        balanceCents: 5000,
      },
    });

    await expect(
      service.createDeposit(userId, 7000, idempotencyKey),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.wallet.update).not.toHaveBeenCalled();
  });

  it('rejects a deposit when the user has no wallet', async () => {
    tx.wallet.findUnique.mockResolvedValue(null);

    await expect(
      service.createDeposit(userId, 5000, idempotencyKey),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(tx.walletTransaction.create).not.toHaveBeenCalled();
  });
});
