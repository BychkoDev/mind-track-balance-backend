import { IsInt, IsOptional, IsString, Max, Min, IsArray, IsEnum, MaxLength, ArrayMaxSize } from 'class-validator';
import { EmotionLogContext } from '@app/prisma-mind-track';

export class CreateEmotionLogDto {
  @IsInt()
  @Min(1)
  @Max(5)
  mood: number;

  @IsInt()
  @Min(1)
  @Max(5)
  stressLevel: number;

  @IsInt()
  @Min(1)
  @Max(5)
  energy: number;

  @IsInt()
  @Min(1)
  @Max(5)
  anxiety: number;

  @IsInt()
  @Min(1)
  @Max(5)
  focus: number;

  @IsInt()
  @Min(1)
  @Max(5)
  recoveryFeeling: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsEnum(EmotionLogContext, { each: true })
  contexts?: EmotionLogContext[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
