import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { WalletTransactionType } from '../../generated/prisma/enums';
import { appendAuditEvent } from '../audit/audit-chain';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { balanceCents: true, reservedCents: true, updatedAt: true },
    });
    if (!wallet) throw new NotFoundException('Carteira não encontrada.');
    return {
      ...wallet,
      availableCents: wallet.balanceCents - wallet.reservedCents,
    };
  }

  async transactions(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) throw new NotFoundException('Carteira não encontrada.');
    return this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDeposit(
    userId: string,
    amountCents: number,
    idempotencyKey: string,
  ) {
    const key = idempotencyKey.trim();

    if (!key || key.length > 255) {
      throw new ConflictException(
        'A chave de idempotência deve ter entre 1 e 255 caracteres.',
      );
    }

    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw new ConflictException('O valor do depósito é inválido.');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.walletTransaction.findUnique({
          where: { idempotencyKey: key },
          include: {
            wallet: {
              select: {
                userId: true,
                balanceCents: true,
              },
            },
          },
        });

        if (existing) {
          return this.validateReplay(existing, userId, amountCents, key);
        }

        const wallet = await tx.wallet.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!wallet) {
          throw new NotFoundException('Carteira não encontrada.');
        }

        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balanceCents: { increment: amountCents },
          },
          select: {
            balanceCents: true,
          },
        });

        const transaction = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: WalletTransactionType.DEPOSIT,
            amountCents,
            idempotencyKey: key,
            referenceType: 'SIMULATED_DEPOSIT',
            referenceId: key,
            description: 'Depósito simulado',
          },
          select: {
            id: true,
            type: true,
            amountCents: true,
            idempotencyKey: true,
            referenceType: true,
            referenceId: true,
            createdAt: true,
          },
        });

        // Auditoria: depósito simulado entra na cadeia de hashes.
        await appendAuditEvent(tx, 'WALLET_DEPOSITED', 'WALLET', wallet.id, {
          walletId: wallet.id,
          userId,
          transactionId: transaction.id,
          amountCents,
        });

        await tx.outboxEvent.create({
          data: {
            eventKey: `wallet-deposit:${transaction.id}`,
            eventType: 'WALLET_UPDATED',
            aggregateType: 'WALLET',
            aggregateId: userId,
            payload: {
              transactionId: transaction.id,
            },
          },
        });

        return {
          ...transaction,
          balanceCents: updatedWallet.balanceCents,
          idempotentReplay: false,
        };
      });
    } catch (error: unknown) {
      // Duas requisições simultâneas podem tentar usar a mesma chave.
      // A restrição UNIQUE faz uma transação falhar e reverter o saldo.
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        const existing = await this.prisma.walletTransaction.findUnique({
          where: { idempotencyKey: key },
          include: {
            wallet: {
              select: {
                userId: true,
                balanceCents: true,
              },
            },
          },
        });

        if (existing) {
          return this.validateReplay(existing, userId, amountCents, key);
        }
      }

      throw error;
    }
  }

  private validateReplay(
    existing: {
      id: string;
      type: WalletTransactionType;
      amountCents: number;
      idempotencyKey: string;
      referenceType: string;
      referenceId: string;
      createdAt: Date;
      wallet: {
        userId: string;
        balanceCents: number;
      };
    },
    userId: string,
    amountCents: number,
    key: string,
  ) {
    const isSameDeposit =
      existing.wallet.userId === userId &&
      existing.type === WalletTransactionType.DEPOSIT &&
      existing.amountCents === amountCents &&
      existing.referenceType === 'SIMULATED_DEPOSIT' &&
      existing.referenceId === key;

    if (!isSameDeposit) {
      throw new ConflictException(
        'Esta chave de idempotência já foi utilizada em outra operação.',
      );
    }

    return {
      id: existing.id,
      type: existing.type,
      amountCents: existing.amountCents,
      idempotencyKey: existing.idempotencyKey,
      referenceType: existing.referenceType,
      referenceId: existing.referenceId,
      createdAt: existing.createdAt,
      balanceCents: existing.wallet.balanceCents,
      idempotentReplay: true,
    };
  }
}
