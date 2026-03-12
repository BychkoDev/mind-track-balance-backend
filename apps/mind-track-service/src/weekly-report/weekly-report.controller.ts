import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { WeeklyReportService } from './weekly-report.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('v1/mind-track/weekly-reports')
export class WeeklyReportController {
  constructor(private readonly service: WeeklyReportService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get(':userUuid')
  async getReports(@Param('userUuid') userUuid: string) {
    return this.service.getReports(userUuid);
  }
}
