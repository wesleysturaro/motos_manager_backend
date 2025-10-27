import { IsString, Length } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @Length(2, 120)
  name!: string;
}
