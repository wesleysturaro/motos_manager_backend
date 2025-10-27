import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AuthResponseDto } from './dto/auth-response.dto';
import { plainToInstance } from 'class-transformer';
import { User } from '../../database/entities/user.entity';
import { Request } from 'express';
import { UserStatus } from '../../database/enums';
import { AppRole } from '../../common/constants/roles.constant';

@Injectable()
export class AuthService {
  private readonly accessTtl: number;
  private readonly refreshTtl: number;

  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTtl = Number(this.configService.get('JWT_ACCESS_TTL', '900'));
    this.refreshTtl = Number(this.configService.get('JWT_REFRESH_TTL', '604800'));
  }

  async register(dto: RegisterDto, request: Request): Promise<AuthResponseDto> {
    await this.usersService.create({
      ...dto,
      roles: ['client'],
    });
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('Nao foi possivel registrar o usuario');
    }
    return this.buildAuthResponse(user, request);
  }

  async login(dto: LoginDto, request: Request): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Usuario inativo');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    return this.buildAuthResponse(user, request);
  }

  async refresh(dto: RefreshTokenDto, request: Request): Promise<AuthResponseDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh-secret'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalido');
    }

    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }

    const tokens = await this.refreshTokensRepository.find({
      where: { user: { id: user.id }, revokedAt: IsNull() },
    });

    let matchedToken: RefreshToken | undefined;
    for (const stored of tokens) {
      const match = await bcrypt.compare(dto.refreshToken, stored.tokenHash);
      if (match && stored.expiresAt > new Date()) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }

    await this.refreshTokensRepository.update(matchedToken.id, { revokedAt: new Date() });

    return this.buildAuthResponse(user, request);
  }

  async logout(userId: string, dto: RefreshTokenDto): Promise<{ success: boolean }> {
    const tokens = await this.refreshTokensRepository.find({
      where: { user: { id: userId }, revokedAt: IsNull() },
    });

    for (const token of tokens) {
      const match = await bcrypt.compare(dto.refreshToken, token.tokenHash);
      if (match) {
        await this.refreshTokensRepository.update(token.id, { revokedAt: new Date() });
        return { success: true };
      }
    }
    throw new NotFoundException('Refresh token nao encontrado');
  }

  private async buildAuthResponse(user: User, request: Request): Promise<AuthResponseDto> {
    let roles = (
      user.userRoles?.map((userRole) => userRole.role?.name).filter(Boolean) ??
      []
    ) as AppRole[];

    if (!roles.length) {
      const fresh = await this.usersService.findOne(user.id);
      roles = fresh.roles as AppRole[];
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'access-secret'),
      expiresIn: this.accessTtl,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh-secret'),
      expiresIn: this.refreshTtl,
    });

    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        user,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(Date.now() + this.refreshTtl * 1000),
        userAgent: request.headers['user-agent'] ?? 'unknown',
        ip: request.ip,
      }),
    );

    const response = plainToInstance(
      AuthResponseDto,
      {
        user: this.usersService.toResponse(user),
        tokens: {
          accessToken,
          refreshToken,
        },
      },
      { excludeExtraneousValues: true },
    );

    return response;
  }
}

