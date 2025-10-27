import { IsEnum, IsNumber, IsNumberString, IsOptional, IsString } from 'class-validator';
import { MotorcycleStatus } from '../../../database/enums';

export class FilterMotorcyclesDto {
  @IsOptional()
  @IsNumberString()
  storeId?: string;

  @IsOptional()
  @IsNumberString()
  brandId?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsEnum(MotorcycleStatus)
  status?: MotorcycleStatus;

  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  minKm?: number;

  @IsOptional()
  @IsNumber()
  maxKm?: number;
}
