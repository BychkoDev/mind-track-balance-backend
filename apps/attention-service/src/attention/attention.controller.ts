import { Controller, Get, Post, Body, UseGuards, UsePipes, ValidationPipe, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@app/common/decorators/user.decorator';
import { AttentionService } from './attention.service';
import { SyncAttentionBatchDto, UpsertAttentionRuleDto } from './dto/attention.dto';

@Controller('api/v1/attention')
@UseGuards(AuthGuard('jwt'))
export class AttentionController {
  constructor(private readonly attentionService: AttentionService) {}

  @Get('config')
  getConfig(@CurrentUser() user: any) {
    return this.attentionService.getConfig(user.sub);
  }

  @Post('config')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  upsertRule(@CurrentUser() user: any, @Body() dto: UpsertAttentionRuleDto) {
    return this.attentionService.upsertRule(user.sub, dto);
  }

  @Post('sync')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  syncBatch(@CurrentUser() user: any, @Body() dto: SyncAttentionBatchDto) {
    return this.attentionService.syncBatch(user.sub, dto);
  }

  @Get('stats')
  getStats(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.attentionService.getStats(user.sub, startDate, endDate);
  }

  @Get('timeline')
  getTimeline(
    @CurrentUser() user: any,
    @Query('days') days?: number
  ) {
    return this.attentionService.getTimeline(user.sub, days ? Number(days) : 7);
  }
}
