import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
}
