import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../auth/auth.type';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../infrastructure/database/prisma.service';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('bids') bids(@Req() req: AuthenticatedRequest) {
    return this.prisma.bid.findMany({
      where: { bidderId: req.user.id },
      include: {
        lot: {
          include: {
            itemSnapshot: true,
            settlement: { include: { receipt: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('wins')
  wins(@Req() req: AuthenticatedRequest) {
    return this.prisma.auctionSettlement.findMany({
      where: {
        winningBid: { bidderId: req.user.id },
      },
      include: {
        lot: {
          include: {
            itemSnapshot: {
              include: {
                catalogItem: {
                  select: {
                    category: true,
                  },
                },
              },
            },
            seller: {
              select: {
                name: true,
              },
            },
          },
        },
        winningBid: {
          include: {
            bidder: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        receipt: true,
      },
      orderBy: {
        settledAt: 'desc',
      },
    });
  }

  /**
   * Notificações do usuário autenticado (BID_OUTBID, AUCTION_WON, LOT_CANCELED).
   * Paginadas por cursor simples e limitadas a 50 itens por chamada.
   */
  @Get('notifications')
  async notifications(@Req() req: AuthenticatedRequest) {
    const [items, unreadCount, totalCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.notification.count({
        where: { userId: req.user.id, readAt: null },
      }),
      this.prisma.notification.count({
        where: { userId: req.user.id },
      }),
    ]);

    return { items, unreadCount, totalCount };
  }

  /** Marca todas as notificações do usuário como lidas. */
  @Patch('notifications/read')
  async markNotificationsRead(@Req() req: AuthenticatedRequest) {
    const result = await this.prisma.notification.updateMany({
      where: { userId: req.user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return { marked: result.count };
  }

  /** Marca uma notificação específica como lida, validando o dono. */
  @Patch('notifications/:id/read')
  async markNotificationRead(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId: req.user.id, readAt: null },
      data: { readAt: new Date() },
    });

    return { marked: result.count };
  }
}
