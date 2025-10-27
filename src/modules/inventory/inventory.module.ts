import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { Motorcycle } from '../../database/entities/motorcycle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Motorcycle])],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
