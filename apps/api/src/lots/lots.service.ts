import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { appendAuditEvent } from '../audit/audit-chain';
import { LotStatus, UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { CancelLotDto, CreateLotDto, UpdateLotDto } from './dto/create-lot.dto';
import { AuthService } from '../auth/auth.service';

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
      const seller = await tx.user.findUniqueOrThrow({
        where: { id: sellerId },
        select: { name: true },
      });

      // "Abrir agora": se o início já chegou, o lote nasce LIVE.
      const startsNow = dto.startsAt.getTime() <= Date.now() + 1000;

      const lot = await tx.lot.create({
        data: {
          sellerId,
          status: startsNow ? LotStatus.LIVE : LotStatus.SCHEDULED,
          category: dto.category?.trim() || item.category?.trim() || null,
          specialConditions: dto.specialConditions?.trim() || null,
          sellerNotes: dto.sellerNotes?.trim() || null,
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
              // Detalhes vindos do catálogo, sobrescritos pelo que o leiloeiro
              // informar no cadastro quando a fonte não fornece.
              medium: dto.medium?.trim() || null,
              dimensions: dto.dimensions?.trim() || null,
              attribution: dto.attribution?.trim() || item.creator || null,
              period: dto.period?.trim() || null,
              imageConditions:
                dto.imageConditions?.trim() ||
                item.images[0]?.rightsNotes ||
                null,
            },
          },
        },
        include: {
          itemSnapshot: true,
          seller: { select: { name: true } },
        },
      });

      await this.audit(tx, 'LOT_CREATED', lot.id, {
        sellerId,
        actorId: sellerId,
        actorName: seller.name,
        catalogItemId: item.id,
        title: item.title,
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

  /**
   * Listagem do catálogo.
   *
   * - Cancelados ficam ocultos por padrão (visíveis apenas via `status=CANCELED`).
   * - Ordenação: ao vivo primeiro, depois agendados, e encerrados por último.
   *   `LotStatus` é um enum textual, então a ordem alfabética não serve:
   *   ordenamos em memória com um peso explícito.
   */
  async list(status?: LotStatus, category?: string) {
    const lots = await this.prisma.lot.findMany({
      where: {
        ...(status ? { status } : { status: { not: LotStatus.CANCELED } }),
        ...(category && category !== 'ALL' ? { category } : {}),
      },
      include: {
        itemSnapshot: true,
        seller: { select: { name: true } },
        _count: {
          select: {
            bids: true,
          },
        },
      },
    });

    const statusWeight: Record<LotStatus, number> = {
      [LotStatus.LIVE]: 0,
      [LotStatus.SCHEDULED]: 1,
      [LotStatus.ENDED]: 2,
      [LotStatus.CANCELED]: 3,
    };

    return lots.sort((a, b) => {
      const byStatus = statusWeight[a.status] - statusWeight[b.status];

      if (byStatus !== 0) return byStatus;

      // Encerrados: do mais recente para o mais antigo.
      if (a.status === LotStatus.ENDED) {
        return b.endsAt.getTime() - a.endsAt.getTime();
      }

      // Ao vivo e agendados: encerramento mais próximo primeiro.
      return a.endsAt.getTime() - b.endsAt.getTime();
    });
  }

  async getPublic(id: string) {
    const lot = await this.prisma.lot.findFirst({
      where: { id },
      include: {
        itemSnapshot: true,
        seller: { select: { name: true } },
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
        bidderAlias: this.alias(bid.bidderId),
        bidderId: undefined,
      })),
      currentLeaderAlias: lot.currentLeaderId
        ? this.alias(lot.currentLeaderId)
        : null,
      currentLeaderId: undefined,
      sellerId: undefined,
    };
  }

  /**
   * Edição do lote antes de entrar ao vivo.
   *
   * Campos alterados são registrados na trilha de auditoria como
   * `LOT_UPDATED`, com o diff "de → para" de cada campo. O histórico é
   * imutável: reflete exatamente o que mudou, quando e por quem.
   */
  async update(sellerId: string, lotId: string, dto: UpdateLotDto) {
    const lot = await this.getOwnedScheduledLot(sellerId, lotId);
    const startsAt = dto.startsAt ?? lot.startsAt;
    const endsAt = dto.endsAt ?? lot.endsAt;
    this.validateSchedule(startsAt, endsAt);

    const snapshot = await this.prisma.lotItemSnapshot.findUnique({
      where: { lotId },
    });

    // Diff apenas dos campos efetivamente enviados.
    const changes: Record<
      string,
      { from: Prisma.InputJsonValue; to: Prisma.InputJsonValue }
    > = {};
    const track = (field: string, before: unknown, after: unknown) => {
      if (after === undefined) return;
      const normalizedAfter =
        typeof after === 'string' ? after.trim() || null : after;
      if (JSON.stringify(before ?? null) === JSON.stringify(normalizedAfter)) {
        return;
      }
      changes[field] = {
        from: (before ?? null) as Prisma.InputJsonValue,
        to: normalizedAfter as Prisma.InputJsonValue,
      };
    };

    track('category', lot.category, dto.category);
    track('specialConditions', lot.specialConditions, dto.specialConditions);
    track('sellerNotes', lot.sellerNotes, dto.sellerNotes);
    track('startingPriceCents', lot.startingPriceCents, dto.startingPriceCents);
    track('minIncrementCents', lot.minIncrementCents, dto.minIncrementCents);
    track(
      'startsAt',
      lot.startsAt.toISOString(),
      dto.startsAt ? startsAt.toISOString() : undefined,
    );
    track(
      'endsAt',
      lot.endsAt.toISOString(),
      dto.endsAt ? endsAt.toISOString() : undefined,
    );
    track('medium', snapshot?.medium ?? null, dto.medium);
    track('dimensions', snapshot?.dimensions ?? null, dto.dimensions);
    track('attribution', snapshot?.attribution ?? null, dto.attribution);
    track('period', snapshot?.period ?? null, dto.period);
    track(
      'imageConditions',
      snapshot?.imageConditions ?? null,
      dto.imageConditions,
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.lot.update({
        where: { id: lotId },
        data: {
          // Campos do snapshot (medium, dimensions, ...) não existem na tabela
          // Lot: são aplicados em `lotItemSnapshot` depois desta atualização.
          ...(dto.category !== undefined
            ? { category: dto.category.trim() || null }
            : {}),
          ...(dto.specialConditions !== undefined
            ? { specialConditions: dto.specialConditions.trim() || null }
            : {}),
          ...(dto.sellerNotes !== undefined
            ? { sellerNotes: dto.sellerNotes.trim() || null }
            : {}),
          ...(dto.startingPriceCents !== undefined
            ? { startingPriceCents: dto.startingPriceCents }
            : {}),
          ...(dto.minIncrementCents !== undefined
            ? { minIncrementCents: dto.minIncrementCents }
            : {}),
          startsAt,
          endsAt,
        },
      });

      // Detalhes do item vivem no snapshot: atualização pontual dos campos.
      const snapshotPatch: Record<string, string | null> = {};
      const assign = (key: string, value?: string) => {
        if (value === undefined) return;
        snapshotPatch[key] = value.trim() || null;
      };
      assign('medium', dto.medium);
      assign('dimensions', dto.dimensions);
      assign('attribution', dto.attribution);
      assign('period', dto.period);
      assign('imageConditions', dto.imageConditions);

      if (Object.keys(snapshotPatch).length > 0) {
        await tx.lotItemSnapshot.update({
          where: { lotId },
          data: snapshotPatch,
        });
      }

      if (Object.keys(changes).length > 0) {
        await appendAuditEvent(tx, 'LOT_UPDATED', 'LOT', lotId, {
          lotId,
          actorId: sellerId,
          changes,
        });

        await tx.outboxEvent.create({
          data: {
            eventKey: `lot-updated:${lotId}:${Date.now()}`,
            eventType: 'LOT_UPDATED',
            aggregateType: 'LOT',
            aggregateId: lotId,
            payload: { lotId },
          },
        });
      }

      return updated;
    });
  }

  async publish(sellerId: string, lotId: string) {
    const lot = await this.getOwnedScheduledLot(sellerId, lotId);
    const published = await this.prisma.$transaction(async (tx) => {
      const result = await tx.lot.update({
        where: { id: lot.id },
        data: { status: LotStatus.LIVE, startsAt: new Date() },
        include: { itemSnapshot: true },
      });
      await this.audit(tx, 'LOT_LIVE', lotId, { actorId: sellerId });
      await tx.outboxEvent.create({
        data: {
          eventKey: `lot-published:${lotId}`,
          eventType: 'LOT_LIVE',
          aggregateType: 'LOT',
          aggregateId: lotId,
          payload: { lotId },
        },
      });
      return result;
    });
    return published;
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
        // Decremento condicional: nunca deixa reservedCents negativo,
        // mesmo com dados inconsistentes.
        const released = await tx.wallet.updateMany({
          where: {
            id: reservation.walletId,
            reservedCents: { gte: reservation.amountCents },
          },
          data: { reservedCents: { decrement: reservation.amountCents } },
        });

        if (released.count !== 1) {
          throw new ConflictException(
            'Não foi possível liberar a reserva do lote: saldo reservado inconsistente.',
          );
        }

        const wallet = await tx.wallet.findUniqueOrThrow({
          where: { id: reservation.walletId },
          select: { userId: true },
        });

        await tx.bidReservation.update({
          where: { id: reservation.id },
          data: { status: 'RELEASED' },
        });

        // Notifica o licitante que teve o saldo devolvido (LOT_CANCELED).
        await tx.notification.create({
          data: {
            userId: wallet.userId,
            type: 'LOT_CANCELED',
            payload: {
              lotId,
              releasedCents: reservation.amountCents,
              reason: dto.reason.trim(),
            },
          },
        });

        await tx.outboxEvent.create({
          data: {
            eventKey: `wallet-updated:lot-cancelled:${lotId}:${wallet.userId}`,
            eventType: 'WALLET_UPDATED',
            aggregateType: 'WALLET',
            aggregateId: wallet.userId,
            payload: { lotId },
          },
        });
      }

      const cancelled = await tx.lot.update({
        where: { id: lotId },
        data: { status: LotStatus.CANCELED },
        include: {
          itemSnapshot: true,
          seller: { select: { name: true } },
        },
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

  /**
   * Listagem do painel do leiloeiro.
   *
   * Retorna os lotes próprios **e** o catálogo público visível, porque o
   * leiloeiro precisa enxergar os lotes ao vivo para acompanhar o mercado —
   * antes ele via uma lista vazia após criar a conta.
   */
  async sellerLots(sellerId: string) {
    const lots = await this.prisma.lot.findMany({
      where: { status: { not: LotStatus.CANCELED } },
      include: {
        itemSnapshot: true,
        settlement: true,
        seller: { select: { name: true } },
        _count: { select: { bids: true } },
      },
    });

    // Os lotes do próprio leiloeiro vêm primeiro; depois o catálogo público,
    // ordenado por estado (ao vivo → agendado → encerrado).
    const statusWeight: Record<LotStatus, number> = {
      [LotStatus.LIVE]: 0,
      [LotStatus.SCHEDULED]: 1,
      [LotStatus.ENDED]: 2,
      [LotStatus.CANCELED]: 3,
    };

    return lots.sort((a, b) => {
      const mineA = a.sellerId === sellerId ? 0 : 1;
      const mineB = b.sellerId === sellerId ? 0 : 1;

      if (mineA !== mineB) return mineA - mineB;

      const byStatus = statusWeight[a.status] - statusWeight[b.status];
      if (byStatus !== 0) return byStatus;

      return b.createdAt.getTime() - a.createdAt.getTime();
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
    // Tolerância de 60s para permitir "abrir agora": o cliente calcula o
    // instante no navegador e a latência de rede não pode invalidar o lote.
    const graceMs = 60_000;

    if (startsAt.getTime() < Date.now() - graceMs || endsAt <= startsAt) {
      throw new ConflictException(
        'Informe uma janela válida para o lote: o início não pode estar no passado e o fim deve ser posterior ao início.',
      );
    }
  }

  private alias(userId: string) {
    return AuthService.publicPseudonym(userId);
  }

  private async audit(
    tx: Prisma.TransactionClient,
    eventType: string,
    entityId: string,
    payload: Prisma.InputJsonValue,
  ) {
    await appendAuditEvent(tx, eventType, 'LOT', entityId, payload);
  }
}
