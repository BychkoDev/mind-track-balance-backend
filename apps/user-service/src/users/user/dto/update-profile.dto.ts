import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserGender } from '../user-gender.enum';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  surname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  about?: string;

  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;
}
