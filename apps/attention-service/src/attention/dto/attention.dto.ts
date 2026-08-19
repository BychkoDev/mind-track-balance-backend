import { IsBoolean, IsNotEmpty, IsString, IsArray, ValidateNested, IsInt, Min, IsDateString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertAttentionRuleDto {
  @IsString()
  @IsNotEmpty()
  domain: string;

  @IsBoolean()
  isBlocked: boolean;
  
  @IsBoolean()
  @IsOptional()
  isTracked?: boolean;

  @IsNumber()
  @IsOptional()
  dailyLimitSec?: number;
}

export class AttentionRecordDto {
  @IsString()
  domain: string;

  @IsInt()
  @Min(1)
  durationSec: number;

  @IsDateString()
  date: string;
}

export class SyncAttentionBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttentionRecordDto)
  records: AttentionRecordDto[];
}
