import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let authService: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtMock = {
    signAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    authService = new AuthService(
      prismaMock as unknown as PrismaService,
      jwtMock as unknown as JwtService,
    );

    jwtMock.signAsync.mockResolvedValue('fake-jwt-token');
  });

  describe('register', () => {
    const dto: RegisterDto = {
      name: 'Licitante de Teste',
      email: 'licitante@example.com',
      password: 'SenhaTeste123!',
      role: UserRole.LICITANTE,
    };

    it('deve cadastrar um usuário e retornar um token', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);

      prismaMock.user.create.mockResolvedValue({
        id: 'user-123',
        name: dto.name,
        email: dto.email,
        role: dto.role,
      });

      const result = await authService.register(dto);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
        select: { id: true },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 12);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash: 'hashed-password',
          role: dto.role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      expect(jwtMock.signAsync).toHaveBeenCalledWith({
        sub: 'user-123',
      });

      expect(result).toEqual({
        accessToken: 'fake-jwt-token',
        tokenType: 'Bearer',
        user: {
          id: 'user-123',
          name: dto.name,
          email: dto.email,
          role: dto.role,
        },
      });

      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('deve rejeitar um e-mail já cadastrado', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'existing-user',
      });

      await expect(authService.register(dto)).rejects.toThrow(
        ConflictException,
      );

      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto: LoginDto = {
      email: 'licitante@example.com',
      password: 'SenhaTeste123!',
    };

    const existingUser = {
      id: 'user-123',
      name: 'Licitante de Teste',
      email: dto.email,
      passwordHash: 'hashed-password',
      role: UserRole.LICITANTE,
    };

    it('deve autenticar um usuário com credenciais válidas', async () => {
      prismaMock.user.findUnique.mockResolvedValue(existingUser);
      jest.mocked(bcrypt.compare).mockImplementation(async () => true);

      const result = await authService.login(dto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        dto.password,
        existingUser.passwordHash,
      );

      expect(jwtMock.signAsync).toHaveBeenCalledWith({
        sub: existingUser.id,
      });

      expect(result).toEqual({
        accessToken: 'fake-jwt-token',
        tokenType: 'Bearer',
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role,
        },
      });

      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('deve rejeitar uma senha incorreta', async () => {
      prismaMock.user.findUnique.mockResolvedValue(existingUser);
      jest.mocked(bcrypt.compare).mockImplementation(async () => false);
      await expect(authService.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });

    it('deve rejeitar um usuário inexistente', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });
  });
});
