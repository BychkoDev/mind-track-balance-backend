import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserGender } from '../../../../../../packages/users-db/src/generated/prisma/enums';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  about?: string;

  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;
}
