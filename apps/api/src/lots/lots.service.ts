import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { LotStatus, UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { CancelLotDto, CreateLotDto, UpdateLotDto } from './dto/create-lot.dto';

@Injectable()
export class LotsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(sellerId: string, dto: CreateLotDto) {
    this.validateSchedule(dto.startsAt, dto.endsAt);
    await this.requireEligibleSeller(sellerId);

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.catalogItem.findUnique({
        where: { id: dto.catalogItemId },
        include: { images: { orderBy: { createdAt: 'asc' }, take: 1 } },
      });
      if (!item)
        throw new NotFoundException('Item de catálogo não encontrado.');

      const lot = await tx.lot.create({
        data: {
          sellerId,
          status: LotStatus.SCHEDULED,
          startingPriceCents: dto.startingPriceCents,
          minIncrementCents: dto.minIncrementCents,
          startsAt: dto.startsAt,
          endsAt: dto.endsAt,
          itemSnapshot: {
            create: {
              catalogItemId: item.id,
              title: item.title,
              description: item.description,
              source: item.source,
              externalId: item.externalId,
              attributes: item.attributes ?? undefined,
              imageUrl: item.images[0]?.sourceUrl,
              imageAttribution: item.images[0]?.attribution,
              sourceUrl: item.sourceUrl,
            },
          },
        },
        include: { itemSnapshot: true },
      });

      await this.audit(tx, 'LOT_CREATED', lot.id, {
        sellerId,
        catalogItemId: item.id,
      });
      await tx.outboxEvent.create({
        data: {
          eventKey: `lot-created:${lot.id}`,
          eventType: 'LOT_CREATED',
          aggregateType: 'LOT',
          aggregateId: lot.id,
          payload: { lotId: lot.id },
        },
      });
      return lot;
    });
  }

  async list(status?: LotStatus) {
    return this.prisma.lot.findMany({
      where: status ? { status } : { status: { not: LotStatus.CANCELED } },
      include: { itemSnapshot: true },
      orderBy: { startsAt: 'asc' },
    });
  }

  async getPublic(id: string) {
    const lot = await this.prisma.lot.findFirst({
      where: { id, status: { not: LotStatus.CANCELED } },
      include: {
        itemSnapshot: true,
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            bidderId: true,
            amountCents: true,
            createdAt: true,
          },
        },
      },
    });
    if (!lot) throw new NotFoundException('Lote não encontrado.');
    return {
      ...lot,
      bids: lot.bids.map((bid) => ({
        ...bid,
        bidderAlias: this.alias(lot.id, bid.bidderId),
        bidderId: undefined,
      })),
      currentLeaderAlias: lot.currentLeaderId
        ? this.alias(lot.id, lot.currentLeaderId)
        : null,
      currentLeaderId: undefined,
      sellerId: undefined,
    };
  }

  async update(sellerId: string, lotId: string, dto: UpdateLotDto) {
    const lot = await this.getOwnedScheduledLot(sellerId, lotId);
    const startsAt = dto.startsAt ?? lot.startsAt;
    const endsAt = dto.endsAt ?? lot.endsAt;
    this.validateSchedule(startsAt, endsAt);
    return this.prisma.lot.update({
      where: { id: lotId },
      data: { ...dto, startsAt, endsAt },
    });
  }

  async cancel(sellerId: string, lotId: string, dto: CancelLotDto) {
    return this.prisma.$transaction(async (tx) => {
      const lots = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Lot" WHERE "id" = ${lotId} FOR UPDATE`;
      if (!lots.length) throw new NotFoundException('Lote não encontrado.');
      const lot = await tx.lot.findUniqueOrThrow({
        where: { id: lotId },
        include: {
          bids: { take: 1 },
          reservations: { where: { status: 'ACTIVE' } },
        },
      });
      if (lot.sellerId !== sellerId)
        throw new ForbiddenException('Você não administra este lote.');
      if (lot.status !== LotStatus.SCHEDULED && lot.status !== LotStatus.LIVE) {
        throw new ConflictException('Este lote não pode mais ser cancelado.');
      }
      if (lot.status === LotStatus.LIVE && lot.endsAt <= new Date()) {
        throw new ConflictException(
          'Lote vencido deve ser liquidado, não cancelado.',
        );
      }
      for (const reservation of lot.reservations) {
        await tx.wallet.update({
          where: { id: reservation.walletId },
          data: { reservedCents: { decrement: reservation.amountCents } },
        });
        await tx.bidReservation.update({
          where: { id: reservation.id },
          data: { status: 'RELEASED' },
        });
      }
      const cancelled = await tx.lot.update({
        where: { id: lotId },
        data: { status: LotStatus.CANCELED },
      });
      await this.audit(tx, 'LOT_CANCELED', lotId, {
        actorId: sellerId,
        reason: dto.reason.trim(),
      });
      await tx.outboxEvent.create({
        data: {
          eventKey: `lot-cancelled:${lotId}`,
          eventType: 'LOT_CANCELED',
          aggregateType: 'LOT',
          aggregateId: lotId,
          payload: { lotId },
        },
      });
      return cancelled;
    });
  }

  async sellerLots(sellerId: string) {
    return this.prisma.lot.findMany({
      where: { sellerId },
      include: { itemSnapshot: true, settlement: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async requireEligibleSeller(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || user.role !== UserRole.LEILOEIRO)
      throw new ForbiddenException('Somente leiloeiros podem criar lotes.');
    const agreement = await this.prisma.sellerAgreement.findFirst({
      where: { userId },
    });
    if (!agreement)
      throw new ForbiddenException(
        'Aceite o termo do leiloeiro antes de criar lotes.',
      );
  }

  private async getOwnedScheduledLot(sellerId: string, lotId: string) {
    const lot = await this.prisma.lot.findUnique({ where: { id: lotId } });
    if (!lot) throw new NotFoundException('Lote não encontrado.');
    if (lot.sellerId !== sellerId)
      throw new ForbiddenException('Você não administra este lote.');
    if (lot.status !== LotStatus.SCHEDULED)
      throw new ConflictException(
        'Lotes ao vivo ou encerrados não podem ser editados.',
      );
    return lot;
  }

  private validateSchedule(startsAt: Date, endsAt: Date) {
    if (startsAt.getTime() <= Date.now() || endsAt <= startsAt)
      throw new ConflictException(
        'Informe uma janela futura e válida para o lote.',
      );
  }

  private alias(lotId: string, userId: string) {
    return `Licitante ${createHash('sha256').update(`${lotId}:${userId}`).digest('hex').slice(0, 6).toUpperCase()}`;
  }

  private async audit(
    tx: any,
    eventType: string,
    entityId: string,
    payload: Record<string, unknown>,
  ) {
    await tx.auditChainState.upsert({
      where: { id: 'global' },
      create: { id: 'global' },
      update: {},
    });
    await tx.$queryRaw`SELECT "id" FROM "AuditChainState" WHERE "id" = 'global' FOR UPDATE`;
    const state = await tx.auditChainState.findUniqueOrThrow({
      where: { id: 'global' },
    });
    const createdAt = new Date();
    const eventHash = createHash('sha256')
      .update(
        JSON.stringify({
          eventType,
          entityType: 'LOT',
          entityId,
          payload,
          previousHash: state.lastEventHash,
          createdAt: createdAt.toISOString(),
        }),
      )
      .digest('hex');
    const event = await tx.auditEvent.create({
      data: {
        eventType,
        entityType: 'LOT',
        entityId,
        payload,
        previousHash: state.lastEventHash,
        eventHash,
        createdAt,
      },
    });
    await tx.auditChainState.update({
      where: { id: 'global' },
      data: { lastSequence: event.sequence, lastEventHash: eventHash },
    });
  }
}
