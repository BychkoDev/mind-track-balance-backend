import { Controller, Get, Param, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { AdviceService } from './advice.service';
import { RolesGuard } from '@app/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('advices')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AdviceController {
  constructor(private readonly adviceService: AdviceService) {}

  @Get()
  async getAdvices(@Req() req: any) {
    const userUuid = req.user.uuid;
    return await this.adviceService.getAdvices(userUuid);
  }

  @Patch(':uuid/read')
  async markAsRead(@Param('uuid') uuid: string, @Req() req: any) {
    const userUuid = req.user.uuid;
    return await this.adviceService.markAdviceAsRead(uuid, userUuid);
  }

  // Temporary endpoint to trigger generation (could be restricted to admins or cron later)
  @Post('generate')
  async triggerGeneration(@Req() req: any) {
    const userUuid = req.user.uuid;
    return await this.adviceService.generateAdviceForUser(userUuid);
  }
}
