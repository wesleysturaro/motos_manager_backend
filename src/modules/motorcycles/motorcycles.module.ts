import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MotorcyclesController } from './motorcycles.controller';
import { MotorcyclesService } from './motorcycles.service';
import { Motorcycle } from '../../database/entities/motorcycle.entity';
import { Store } from '../../database/entities/store.entity';
import { Brand } from '../../database/entities/brand.entity';
import { MotorcyclePhoto } from '../../database/entities/motorcycle-photo.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Motorcycle, Store, Brand, MotorcyclePhoto, User])],
  controllers: [MotorcyclesController],
  providers: [MotorcyclesService],
  exports: [MotorcyclesService],
})
export class MotorcyclesModule {}
