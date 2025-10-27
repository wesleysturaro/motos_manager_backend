import { AppRole, ROLES } from '../../../common/constants/roles.constant';
import { UserStatus } from '../../../database/enums';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsNumberString()
  @IsOptional()
  storeId?: string;

  @IsArray()
  @IsIn(ROLES, { each: true })
  @IsOptional()
  roles?: AppRole[];
}
