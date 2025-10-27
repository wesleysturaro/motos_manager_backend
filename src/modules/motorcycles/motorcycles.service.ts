import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    DataSource,
    Repository,
} from 'typeorm';
import { Motorcycle } from '../../database/entities/motorcycle.entity';
import { Store } from '../../database/entities/store.entity';
import { Brand } from '../../database/entities/brand.entity';
import { MotorcyclePhoto } from '../../database/entities/motorcycle-photo.entity';
import { User } from '../../database/entities/user.entity';
import { CreateMotorcycleDto } from './dto/create-motorcycle.dto';
import { UpdateMotorcycleDto } from './dto/update-motorcycle.dto';
import { FilterMotorcyclesDto } from './dto/filter-motorcycles.dto';
import { MotorcycleResponseDto } from './dto/motorcycle-response.dto';
import { plainToInstance } from 'class-transformer';
import { MotorcycleStatus } from '../../database/enums';
import { AddMotorcyclePhotosDto } from './dto/add-motorcycle-photos.dto';
import { relative } from 'path';
import type { UploadedFile } from './types/uploaded-file.type';

@Injectable()
export class MotorcyclesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Motorcycle)
    private readonly motorcyclesRepository: Repository<Motorcycle>,
    @InjectRepository(MotorcyclePhoto)
    private readonly photosRepository: Repository<MotorcyclePhoto>,
  ) {}

  async findAll(filters: FilterMotorcyclesDto): Promise<MotorcycleResponseDto[]> {
    const qb = this.motorcyclesRepository
      .createQueryBuilder('motorcycle')
      .leftJoinAndSelect('motorcycle.store', 'store')
      .leftJoinAndSelect('motorcycle.brand', 'brand')
      .leftJoinAndSelect('motorcycle.photos', 'photos')
      .where('motorcycle.isDeleted = :deleted', { deleted: false });

    if (filters.storeId) {
      qb.andWhere('motorcycle.store_id = :storeId', { storeId: filters.storeId });
    }

    if (filters.brandId) {
      qb.andWhere('motorcycle.brand_id = :brandId', { brandId: filters.brandId });
    }

    if (filters.modelName?.trim()) {
      const modelFilter = filters.modelName.trim();
      qb.andWhere('LOWER(motorcycle.model_name) LIKE LOWER(:modelName)', {
        modelName: `%${modelFilter}%`,
      });
    }

    if (filters.status) {
      qb.andWhere('motorcycle.status = :status', { status: filters.status });
    }

    if (filters.year) {
      qb.andWhere('motorcycle.year = :year', { year: filters.year });
    }

    if (typeof filters.minPrice === 'number') {
      qb.andWhere('motorcycle.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (typeof filters.maxPrice === 'number') {
      qb.andWhere('motorcycle.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (typeof filters.minKm === 'number') {
      qb.andWhere('motorcycle.km >= :minKm', { minKm: filters.minKm });
    }

    if (typeof filters.maxKm === 'number') {
      qb.andWhere('motorcycle.km <= :maxKm', { maxKm: filters.maxKm });
    }

    qb.orderBy('motorcycle.createdAt', 'DESC');

    const motorcycles = await qb.getMany();
    return motorcycles.map((motorcycle) => this.toResponse(motorcycle));
  }

  async findOne(id: string): Promise<MotorcycleResponseDto> {
    const motorcycle = await this.motorcyclesRepository.findOne({
      where: { id },
      relations: {
        store: true,
        brand: true,
        photos: true,
      },
    });

    if (!motorcycle || motorcycle.isDeleted) {
      throw new NotFoundException('Moto nao encontrada');
    }

    return this.toResponse(motorcycle);
  }

  async create(dto: CreateMotorcycleDto, userId: string): Promise<MotorcycleResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const [store, brand, user] = await Promise.all([
        manager.findOne(Store, { where: { id: dto.storeId } }),
        manager.findOne(Brand, { where: { id: dto.brandId } }),
        manager.findOne(User, { where: { id: userId } }),
      ]);

      if (!store || !brand) {
        throw new BadRequestException('Loja ou marca invalida');
      }
      if (!dto.modelName?.trim()) {
        throw new BadRequestException('Modelo da moto obrigatorio');
      }

      const motorcycle = manager.create(Motorcycle, {
        store,
        brand,
        modelName: dto.modelName.trim(),
        status: dto.status ?? MotorcycleStatus.AVAILABLE,
        createdBy: user ?? null,
      });
      this.assignScalarFields(motorcycle, dto);

      await manager.save(motorcycle);

      if (dto.photoUrls?.length) {
        await this.savePhotosRecords(manager, motorcycle, dto.photoUrls);
      }

      await this.refreshScore(manager, motorcycle.id);

      const reloaded = await manager.findOneOrFail(Motorcycle, {
        where: { id: motorcycle.id },
        relations: { store: true, brand: true, photos: true },
      });

      return this.toResponse(reloaded);
    });
  }

  async update(
    id: string,
    dto: UpdateMotorcycleDto,
    userId: string,
  ): Promise<MotorcycleResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const motorcycle = await manager.findOne(Motorcycle, {
        where: { id },
        relations: { store: true, brand: true, photos: true },
      });

      if (!motorcycle || motorcycle.isDeleted) {
        throw new NotFoundException('Moto nao encontrada');
      }

      if (dto.storeId) {
        const store = await manager.findOne(Store, { where: { id: dto.storeId } });
        if (!store) throw new BadRequestException('Loja invalida');
        motorcycle.store = store;
      }
      if (dto.brandId) {
        const brand = await manager.findOne(Brand, { where: { id: dto.brandId } });
        if (!brand) throw new BadRequestException('Marca invalida');
        motorcycle.brand = brand;
      }
      if (typeof dto.modelName !== 'undefined' && dto.modelName !== null) {
        motorcycle.modelName = dto.modelName.trim();
      }

      this.assignScalarFields(motorcycle, dto);

      if (userId) {
        const user = await manager.findOne(User, { where: { id: userId } });
        motorcycle.updatedBy = user ?? null;
      }

      await manager.save(motorcycle);
      await this.refreshScore(manager, motorcycle.id);

      const reloaded = await manager.findOneOrFail(Motorcycle, {
        where: { id: motorcycle.id },
        relations: { store: true, brand: true, photos: true },
      });
      return this.toResponse(reloaded);
    });
  }

  async remove(id: string): Promise<void> {
    const motorcycle = await this.motorcyclesRepository.findOne({ where: { id } });
    if (!motorcycle || motorcycle.isDeleted) {
      throw new NotFoundException('Moto nao encontrada');
    }
    motorcycle.isDeleted = true;
    await this.motorcyclesRepository.save(motorcycle);
  }

  async addPhotos(
    id: string,
    files: UploadedFile[],
    body: AddMotorcyclePhotosDto,
  ): Promise<MotorcycleResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const motorcycle = await manager.findOne(Motorcycle, {
        where: { id },
        relations: { photos: true, store: true, brand: true, },
      });

      if (!motorcycle || motorcycle.isDeleted) {
        throw new NotFoundException('Moto nao encontrada');
      }

      const uploads: string[] = [];
      if (files?.length) {
        for (const file of files) {
          uploads.push(relative(process.cwd(), file.path));
        }
      }

      const photoUrls = [
        ...(body?.urls ?? []),
        ...uploads.map((path) => path.replace(/\\/g, '/')),
      ];

      await this.savePhotosRecords(manager, motorcycle, photoUrls);
      await this.refreshScore(manager, id);

      const reloaded = await manager.findOneOrFail(Motorcycle, {
        where: { id },
        relations: { store: true, brand: true, photos: true },
      });

      return this.toResponse(reloaded);
    });
  }

  async removePhoto(motorcycleId: string, photoId: string): Promise<void> {
    const photo = await this.photosRepository.findOne({
      where: { id: photoId },
      relations: { motorcycle: true },
    });
    if (!photo || photo.motorcycle.id !== motorcycleId) {
      throw new NotFoundException('Foto nao encontrada');
    }
    await this.photosRepository.remove(photo);
    await this.refreshScore(this.dataSource.manager, motorcycleId);
  }

  private async savePhotosRecords(
    manager: DataSource['manager'],
    motorcycle: Motorcycle,
    urls: string[],
  ) {
    if (!urls.length) return;
    const existingCount = await manager.count(MotorcyclePhoto, {
      where: { motorcycle: { id: motorcycle.id } },
    });
    const records = urls.map((url, index) =>
      manager.create(MotorcyclePhoto, {
        motorcycle,
        pathOrUrl: url,
        isCover: existingCount === 0 && index === 0,
        sortOrder: existingCount + index,
      }),
    );
    await manager.save(records);
  }

  private async refreshScore(manager: DataSource['manager'], motorcycleId: string) {
    const motorcycle = await manager.findOne(Motorcycle, {
      where: { id: motorcycleId },
      relations: { photos: true },
    });
    if (!motorcycle) {
      throw new NotFoundException('Moto nao encontrada para calculo de score');
    }
    const { score, missingFields } = this.calculateCompleteness(motorcycle);
    motorcycle.completenessScore = score;
    motorcycle.missingFields = missingFields;
    await manager.save(motorcycle);
  }

  private calculateCompleteness(motorcycle: Motorcycle) {
    const requiredFields: (keyof Motorcycle)[] = [
      'modelName','year',
      'color',
      'vin',
      'plate',
      'km',
      'price',
      'cost',
      'fuel',
      'engineCc',
      'powerHp',
      'torqueNm',
      'transmission',
      'abs',
      'description',
      'hasDocumentation',
      'hasInspection',
    ];

    const missing: string[] = [];
    let filled = 0;
    requiredFields.forEach((field) => {
      const value = motorcycle[field];
      if (value === null || value === undefined || value === '') {
        missing.push(field as string);
      } else {
        filled += 1;
      }
    });

    if (!motorcycle.photos?.length) {
      missing.push('photos');
    } else {
      filled += 1;
    }

    const total = requiredFields.length + 1;
    const score = Math.round((filled / total) * 100);

    return { score, missingFields: missing };
  }

  private assignScalarFields(motorcycle: Motorcycle, dto: Partial<CreateMotorcycleDto>) {
    if (typeof dto.modelName !== 'undefined' && dto.modelName !== null) {
      motorcycle.modelName = dto.modelName.trim();
    }
    if (typeof dto.year !== 'undefined') motorcycle.year = dto.year;
    if (typeof dto.color !== 'undefined') motorcycle.color = dto.color ?? null;
    if (typeof dto.vin !== 'undefined') motorcycle.vin = dto.vin ?? null;
    if (typeof dto.plate !== 'undefined') motorcycle.plate = dto.plate ?? null;
    if (typeof dto.km !== 'undefined') motorcycle.km = dto.km ?? null;
    if (typeof dto.price !== 'undefined')
      motorcycle.price = dto.price !== null && dto.price !== undefined ? dto.price.toString() : null;
    if (typeof dto.cost !== 'undefined')
      motorcycle.cost = dto.cost !== null && dto.cost !== undefined ? dto.cost.toString() : null;
    if (typeof dto.status !== 'undefined') motorcycle.status = dto.status;
    if (typeof dto.fuel !== 'undefined') motorcycle.fuel = dto.fuel ?? null;
    if (typeof dto.engineCc !== 'undefined') motorcycle.engineCc = dto.engineCc ?? null;
    if (typeof dto.powerHp !== 'undefined') motorcycle.powerHp = dto.powerHp ?? null;
    if (typeof dto.torqueNm !== 'undefined') motorcycle.torqueNm = dto.torqueNm ?? null;
    if (typeof dto.transmission !== 'undefined') motorcycle.transmission = dto.transmission ?? null;
    if (typeof dto.abs !== 'undefined') motorcycle.abs = dto.abs;
    if (typeof dto.description !== 'undefined') motorcycle.description = dto.description ?? null;
    if (typeof dto.hasDocumentation !== 'undefined')
      motorcycle.hasDocumentation = dto.hasDocumentation ?? null;
    if (typeof dto.hasInspection !== 'undefined') motorcycle.hasInspection = dto.hasInspection ?? null;
    if (typeof dto.clientName !== 'undefined') motorcycle.clientName = dto.clientName ?? null;
    if (typeof dto.clientPhone !== 'undefined') motorcycle.clientPhone = dto.clientPhone ?? null;
    if (typeof dto.documentCost !== 'undefined')
      motorcycle.documentCost =
        dto.documentCost !== null && dto.documentCost !== undefined
          ? dto.documentCost.toString()
          : null;
    if (typeof dto.maintenanceCost !== 'undefined')
      motorcycle.maintenanceCost =
        dto.maintenanceCost !== null && dto.maintenanceCost !== undefined
          ? dto.maintenanceCost.toString()
          : null;
    if (typeof dto.downPayment !== 'undefined')
      motorcycle.downPayment =
        dto.downPayment !== null && dto.downPayment !== undefined
          ? dto.downPayment.toString()
          : null;
  }

  private toResponse(motorcycle: Motorcycle): MotorcycleResponseDto {
    const plain = {
      id: motorcycle.id,
      status: motorcycle.status,
      store: motorcycle.store ? { id: motorcycle.store.id, name: motorcycle.store.name } : null,
      brand: motorcycle.brand ? { id: motorcycle.brand.id, name: motorcycle.brand.name } : null,
      modelName: motorcycle.modelName,
      year: motorcycle.year,
      color: motorcycle.color,
      vin: motorcycle.vin,
      plate: motorcycle.plate,
      km: motorcycle.km,
      price: motorcycle.price,
      cost: motorcycle.cost,
      fuel: motorcycle.fuel,
      engineCc: motorcycle.engineCc,
      powerHp: motorcycle.powerHp,
      torqueNm: motorcycle.torqueNm,
      transmission: motorcycle.transmission,
      abs: motorcycle.abs,
      description: motorcycle.description,
      hasDocumentation: motorcycle.hasDocumentation,
      hasInspection: motorcycle.hasInspection,
      clientName: motorcycle.clientName,
      clientPhone: motorcycle.clientPhone,
      documentCost: motorcycle.documentCost,
      maintenanceCost: motorcycle.maintenanceCost,
      downPayment: motorcycle.downPayment,
      completenessScore: motorcycle.completenessScore ?? 0,
      missingFields: motorcycle.missingFields ?? [],
      photos: motorcycle.photos?.map((photo) => ({
        id: photo.id,
        pathOrUrl: photo.pathOrUrl,
        isCover: photo.isCover,
        sortOrder: photo.sortOrder,
      })),
      createdAt: motorcycle.createdAt,
      updatedAt: motorcycle.updatedAt,
    };

    return plainToInstance(MotorcycleResponseDto, plain, { excludeExtraneousValues: true });
  }
}
