import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { accessTokenExpiresIn } from './jwt-expires';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.count();
    const role = existing === 0 ? Role.ADMIN : Role.VIEWER;

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash,
        role,
      },
    });

    await this.audit.log(user.id, 'USER_REGISTER', 'User', user.id, {
      email: user.email,
    });

    return this.issueTokens(user.id, user.email, user.role, user.name);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.audit.log(user.id, 'USER_LOGIN', 'User', user.id);

    return this.issueTokens(user.id, user.email, user.role, user.name);
  }

  async refresh(refreshToken: string) {
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    await this.prisma.refreshToken.delete({ where: { id: record.id } });

    return this.issueTokens(
      record.user.id,
      record.user.email,
      record.user.role,
      record.user.name,
    );
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId, token: refreshToken },
      });
    } else {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    await this.audit.log(userId, 'USER_LOGOUT', 'User', userId);
    return { success: true };
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: Role,
    name: string,
  ) {
    const payload: JwtPayload = { sub: userId, email, role };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTokenExpiresIn(this.config),
    });

    const refreshRaw = randomBytes(48).toString('hex');
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshRaw,
        expiresAt: refreshExpires,
      },
    });

    return {
      accessToken,
      refreshToken: refreshRaw,
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES') ?? '15m',
      user: { id: userId, email, role, name },
    };
  }
}
