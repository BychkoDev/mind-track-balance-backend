import { IsEnum, IsOptional, IsTimeZone } from 'class-validator';
import { Locale } from '@prisma/client';

export class UpdateSettingsDto {
  @IsOptional()
  @IsTimeZone()
  timezone?: string;

  @IsOptional()
  @IsEnum(Locale)
  locale?: Locale;
}
