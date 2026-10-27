import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from './auth.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Este email já está cadastrado.');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        role: dto.role,
        wallet: {
          create: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return this.createAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const passwordMatches = user.passwordHash.startsWith('$argon2')
      ? await argon2.verify(user.passwordHash, dto.password)
      : await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    if (!user.passwordHash.startsWith('$argon2')) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: await argon2.hash(dto.password, {
            type: argon2.argon2id,
          }),
        },
      });
    }

    return this.createAuthResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }

  private async createAuthResponse(user: AuthenticatedUser) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });

    const refreshToken = await this.createRefreshToken(user.id);
    return {
      accessToken,
      tokenType: 'Bearer',
      user,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const [sessionId, secret] = refreshToken.split('.');
    if (!sessionId || !secret)
      throw new UnauthorizedException('Refresh token inválido.');
    const session = await this.prisma.refreshSession.findUnique({
      where: { id: sessionId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !(await argon2.verify(session.tokenHash, secret))
    )
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.createAuthResponse(session.user);
  }

  async logout(refreshToken: string) {
    const [sessionId] = refreshToken.split('.');
    if (sessionId)
      await this.prisma.refreshSession.updateMany({
        where: { id: sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
  }

  private async createRefreshToken(userId: string) {
    const secret = randomBytes(48).toString('base64url');
    const session = await this.prisma.refreshSession.create({
      data: {
        userId,
        tokenHash: await argon2.hash(secret, { type: argon2.argon2id }),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    return `${session.id}.${secret}`;
  }
}
