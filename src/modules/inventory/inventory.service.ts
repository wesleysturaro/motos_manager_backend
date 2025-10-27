import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Motorcycle } from '../../database/entities/motorcycle.entity';
import { MotorcycleResponseDto } from '../motorcycles/dto/motorcycle-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Motorcycle)
    private readonly motorcyclesRepository: Repository<Motorcycle>,
  ) {}

  async getSummary() {
    const baseQuery = this.motorcyclesRepository
      .createQueryBuilder('motorcycle')
      .where('motorcycle.isDeleted = false');

    const byStatus = await baseQuery
      .clone()
      .select('motorcycle.status', 'status')
      .addSelect('COUNT(*)', 'total')
      .groupBy('motorcycle.status')
      .getRawMany();

    const byBrand = await baseQuery
      .clone()
      .leftJoin('motorcycle.brand', 'brand')
      .select('brand.id', 'brandId')
      .addSelect('brand.name', 'brandName')
      .addSelect('COUNT(*)', 'total')
      .groupBy('brand.id')
      .addGroupBy('brand.name')
      .getRawMany();

    const byModel = await baseQuery
      .clone()
      .select('motorcycle.model_name', 'modelName')
      .addSelect('COUNT(*)', 'total')
      .groupBy('motorcycle.model_name')
      .getRawMany();

    return {
      byStatus,
      byBrand,
      byModel,
    };
  }

  async findWithMissingData(): Promise<MotorcycleResponseDto[]> {
    const motorcycles = await this.motorcyclesRepository.find({
      where: { isDeleted: false },
      relations: { store: true, brand: true, photos: true },
      order: { completenessScore: 'ASC' },
    });

    const filtered = motorcycles.filter(
      (motorcycle) => (motorcycle.completenessScore ?? 0) < 80,
    );

    return filtered.map((motorcycle) =>
      plainToInstance(
        MotorcycleResponseDto,
        {
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
        },
        { excludeExtraneousValues: true },
      ),
    );
  }
}
