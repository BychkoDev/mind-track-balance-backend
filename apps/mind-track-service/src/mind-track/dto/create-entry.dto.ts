import { IsInt, IsOptional, IsString, Max, Min, IsArray } from 'class-validator';

export class CreateEntryDto {
  @IsInt()
  @Min(1)
  @Max(10)
  moodScore: number;

  @IsOptional()
  @IsString()
  text?: string;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
