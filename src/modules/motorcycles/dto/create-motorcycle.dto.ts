import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MotorcycleStatus, FuelType, TransmissionType } from '../../../database/enums';

export class CreateMotorcycleDto {
  @IsNumberString()
  storeId!: string;

  @IsNumberString()
  brandId!: string;

  @IsString()
  modelName!: string;

  @IsOptional()
  @IsNumber()
  @Min(1970)
  @Max(new Date().getFullYear() + 1)
  year?: number;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsString()
  @IsOptional()
  plate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  km?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsEnum(MotorcycleStatus)
  @IsOptional()
  status?: MotorcycleStatus;

  @IsEnum(FuelType)
  @IsOptional()
  fuel?: FuelType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  engineCc?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  powerHp?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  torqueNm?: number;

  @IsEnum(TransmissionType)
  @IsOptional()
  transmission?: TransmissionType;

  @IsBoolean()
  @IsOptional()
  abs?: boolean;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  hasDocumentation?: boolean;

  @IsBoolean()
  @IsOptional()
  hasInspection?: boolean;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsString()
  @IsOptional()
  clientPhone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  documentCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maintenanceCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  downPayment?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photoUrls?: string[];
}
