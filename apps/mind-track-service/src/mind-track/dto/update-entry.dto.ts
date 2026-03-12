import { IsInt, IsOptional, IsString, Max, Min, IsArray } from 'class-validator';

export class UpdateEntryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  moodScore?: number;

  @IsOptional()
  @IsString()
  text?: string;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // Fields for internal AI updates, optional and typically not passed by user
  @IsOptional()
  @IsString()
  aiSentiment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  aiTopics?: string[];
}

