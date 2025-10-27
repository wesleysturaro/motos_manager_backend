import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { AppRole, ROLES } from '../../../common/constants/roles.constant';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsArray()
  @IsIn(ROLES, { each: true })
  @IsOptional()
  roles?: AppRole[];
}
