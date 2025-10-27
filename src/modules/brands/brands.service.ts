import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../../database/entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { BrandResponseDto } from './dto/brand-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandsRepository: Repository<Brand>,
  ) {}

  async findAll(): Promise<BrandResponseDto[]> {
    const brands = await this.brandsRepository.find({
      order: { name: 'ASC' },
    });
    return brands.map((brand) => this.toResponse(brand));
  }

  async findOne(id: string): Promise<BrandResponseDto> {
    const brand = await this.brandsRepository.findOne({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Marca nao encontrada');
    }
    return this.toResponse(brand);
  }

  async create(dto: CreateBrandDto): Promise<BrandResponseDto> {
    const brand = this.brandsRepository.create(dto);
    await this.brandsRepository.save(brand);
    return this.toResponse(brand);
  }

  async update(id: string, dto: UpdateBrandDto): Promise<BrandResponseDto> {
    const brand = await this.brandsRepository.findOne({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Marca nao encontrada');
    }
    Object.assign(brand, dto);
    await this.brandsRepository.save(brand);
    return this.toResponse(brand);
  }

  async remove(id: string): Promise<void> {
    const brand = await this.brandsRepository.findOne({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Marca nao encontrada');
    }
    await this.brandsRepository.remove(brand);
  }

  private toResponse(brand: Brand): BrandResponseDto {
    return plainToInstance(BrandResponseDto, brand, { excludeExtraneousValues: true });
  }
}
