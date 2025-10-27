import { Expose, Type } from 'class-transformer';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthTokensDto {
  @Expose()
  accessToken!: string;

  @Expose()
  refreshToken!: string;
}

export class AuthResponseDto {
  @Expose()
  @Type(() => UserResponseDto)
  user!: UserResponseDto;

  @Expose()
  @Type(() => AuthTokensDto)
  tokens!: AuthTokensDto;
}
