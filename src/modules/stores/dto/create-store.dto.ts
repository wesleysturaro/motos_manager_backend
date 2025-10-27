import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsString()
  @Length(11, 20)
  @IsOptional()
  cnpj?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @Length(2, 2)
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
