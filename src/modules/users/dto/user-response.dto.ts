import { Expose, Type } from 'class-transformer';
import { AppRole } from '../../../common/constants/roles.constant';
import { UserStatus } from '../../../database/enums';

class StoreSummaryDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  city?: string | null;

  @Expose()
  state?: string | null;
}

export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  name!: string;

  @Expose()
  email!: string;

  @Expose()
  status!: UserStatus;

  @Expose()
  roles!: AppRole[];

  @Expose()
  @Type(() => StoreSummaryDto)
  store?: StoreSummaryDto | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
