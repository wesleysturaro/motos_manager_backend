import { Expose } from 'class-transformer';

export class StoreResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  cnpj?: string | null;

  @Expose()
  city?: string | null;

  @Expose()
  state?: string | null;

  @Expose()
  address?: string | null;

  @Expose()
  phone?: string | null;

  @Expose()
  isActive!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
