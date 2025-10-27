import { Expose, Type } from 'class-transformer';
import { MotorcycleStatus, FuelType, TransmissionType } from '../../../database/enums';

class PhotoResponseDto {
  @Expose()
  id!: string;

  @Expose()
  pathOrUrl!: string;

  @Expose()
  isCover!: boolean;

  @Expose()
  sortOrder!: number;
}

class SimpleEntityDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;
}

export class MotorcycleResponseDto {
  @Expose()
  id!: string;

  @Expose()
  status!: MotorcycleStatus;

  @Expose()
  store!: SimpleEntityDto | null;

  @Expose()
  brand!: SimpleEntityDto | null;

  @Expose()
  modelName!: string;

  @Expose()
  year?: number | null;

  @Expose()
  color?: string | null;

  @Expose()
  vin?: string | null;

  @Expose()
  plate?: string | null;

  @Expose()
  km?: number | null;

  @Expose()
  price?: string | null;

  @Expose()
  cost?: string | null;

  @Expose()
  fuel?: FuelType | null;

  @Expose()
  engineCc?: number | null;

  @Expose()
  powerHp?: number | null;

  @Expose()
  torqueNm?: number | null;

  @Expose()
  transmission?: TransmissionType | null;

  @Expose()
  abs?: boolean | null;

  @Expose()
  description?: string | null;

  @Expose()
  hasDocumentation?: boolean | null;

  @Expose()
  hasInspection?: boolean | null;

  @Expose()
  clientName?: string | null;

  @Expose()
  clientPhone?: string | null;

  @Expose()
  documentCost?: string | null;

  @Expose()
  maintenanceCost?: string | null;

  @Expose()
  downPayment?: string | null;

  @Expose()
  completenessScore!: number;

  @Expose()
  missingFields?: string[] | null;

  @Expose()
  @Type(() => PhotoResponseDto)
  photos?: PhotoResponseDto[];

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
