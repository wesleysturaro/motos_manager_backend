import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../../database/entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { StoreResponseDto } from './dto/store-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
  ) {}

  async findAll(): Promise<StoreResponseDto[]> {
    const stores = await this.storesRepository.find({ order: { name: 'ASC' } });
    return stores.map((store) => this.toResponse(store));
  }

  async findOne(id: string): Promise<StoreResponseDto> {
    const store = await this.storesRepository.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('Loja nao encontrada');
    }
    return this.toResponse(store);
  }

  async create(dto: CreateStoreDto): Promise<StoreResponseDto> {
    const store = this.storesRepository.create(dto);
    await this.storesRepository.save(store);
    return this.toResponse(store);
  }

  async update(id: string, dto: UpdateStoreDto): Promise<StoreResponseDto> {
    const store = await this.storesRepository.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('Loja nao encontrada');
    }
    Object.assign(store, dto);
    await this.storesRepository.save(store);
    return this.toResponse(store);
  }

  async remove(id: string): Promise<void> {
    const store = await this.storesRepository.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('Loja nao encontrada');
    }
    await this.storesRepository.remove(store);
  }

  private toResponse(store: Store): StoreResponseDto {
    return plainToInstance(StoreResponseDto, store, { excludeExtraneousValues: true });
  }
}
