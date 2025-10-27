import { IsArray, IsOptional, IsString } from 'class-validator';

export class AddMotorcyclePhotosDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  urls?: string[];
}
