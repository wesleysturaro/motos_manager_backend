import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Store } from '../../database/entities/store.entity';
import { Role } from '../../database/entities/role.entity';
import { UserRole } from '../../database/entities/user-role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { AppRole, ROLES } from '../../common/constants/roles.constant';
import { UserStatus } from '../../database/enums';

@Injectable()
export class UsersService {
  private readonly relations = {
    store: true,
    userRoles: { role: true },
  } as const;

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.find({
      relations: this.relations,
      order: { createdAt: 'DESC' },
    });

    return users.map((user) => this.toResponse(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: this.relations,
    });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    return this.toResponse(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: this.relations,
    });
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(User, { where: { email: dto.email } });
      if (existing) {
        throw new BadRequestException('E-mail ja cadastrado');
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);

      const user = manager.create(User, {
        name: dto.name,
        email: dto.email,
        status: dto.status ?? UserStatus.ACTIVE,
        passwordHash,
      });

      if (typeof dto.storeId !== 'undefined') {
        const store = await manager.findOne(Store, { where: { id: dto.storeId } });
        if (!store) {
          throw new NotFoundException('Loja nao encontrada');
        }
        user.store = store;
      }

      await manager.save(user);
      const rolesToAssign = dto.roles?.length ? dto.roles : (['client'] as AppRole[]);
      await this.assignRoles(manager, user.id, rolesToAssign);

      const reloaded = await manager.findOneOrFail(User, {
        where: { id: user.id },
        relations: this.relations,
      });
      return this.toResponse(reloaded);
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, {
        where: { id },
        relations: this.relations,
      });
      if (!user) {
        throw new NotFoundException('Usuario nao encontrado');
      }

      if (dto.email && dto.email !== user.email) {
        const existing = await manager.findOne(User, { where: { email: dto.email } });
        if (existing) {
          throw new BadRequestException('E-mail ja utilizado por outro usuario');
        }
      }

      if (typeof dto.storeId !== 'undefined') {
        const store = await manager.findOne(Store, { where: { id: dto.storeId } });
        if (!store) {
          throw new NotFoundException('Loja nao encontrada');
        }
        user.store = store;
      }

      if (dto.password) {
        user.passwordHash = await bcrypt.hash(dto.password, 10);
      }

      Object.assign(user, {
        name: dto.name ?? user.name,
        email: dto.email ?? user.email,
        status: dto.status ?? user.status,
      });

      await manager.save(user);

      if (dto.roles) {
        await this.assignRoles(manager, user.id, dto.roles);
      }

      const reloaded = await manager.findOneOrFail(User, {
        where: { id: user.id },
        relations: this.relations,
      });
      return this.toResponse(reloaded);
    });
  }

  async softDelete(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: this.relations,
    });
    if (!user) {
      throw new NotFoundException('Usuario nao encontrado');
    }
    user.status = UserStatus.INACTIVE;
    await this.usersRepository.save(user);
    return this.toResponse(user);
  }

  private async assignRoles(manager: EntityManager, userId: string, roles: AppRole[]) {
    const uniqueRoles = [...new Set(roles)];
    uniqueRoles.forEach((role) => {
      if (!ROLES.includes(role)) {
        throw new BadRequestException(`Perfil invalido: ${role}`);
      }
    });

    const storedRoles = await manager.find(Role, {
      where: { name: In(uniqueRoles) },
    });

    if (storedRoles.length !== uniqueRoles.length) {
      throw new BadRequestException('Um ou mais perfis sao invalidos');
    }

    await manager.delete(UserRole, { userId });
    const records = storedRoles.map((role) =>
      manager.create(UserRole, { userId, roleId: role.id }),
    );
    await manager.save(records);
  }

  toResponse(user: User): UserResponseDto {
    const roles =
      user.userRoles?.map((userRole) => userRole.role?.name).filter(Boolean) ?? [];
    const plain = {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      roles,
      store: user.store
        ? {
            id: user.store.id,
            name: user.store.name,
            city: user.store.city,
            state: user.store.state,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    return plainToInstance(UserResponseDto, plain, { excludeExtraneousValues: true });
  }
}

