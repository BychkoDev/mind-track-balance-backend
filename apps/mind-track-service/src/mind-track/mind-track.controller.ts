import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '@app/common/decorators/user.decorator';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role } from '@app/prisma-auth';
import { Roles } from '@app/common/decorators/roles.decorator';
import { MindTrackService } from './mind-track.service';
import { CreateEmotionLogDto } from './dto/create-emotion-log.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';

@Controller('/api/v1/mind-track')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.USER, Role.ADMIN)
export class MindTrackController {
  constructor(private readonly mindTrackService: MindTrackService) {}

  @Post('entries')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  createEntry(@CurrentUser() user: any, @Body() dto: CreateEmotionLogDto) {
    return this.mindTrackService.createEntry(user.sub, dto, user.role);
  }

  @Get('entries')
  getEntries(
    @CurrentUser() user: { sub: string },
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
    @Query('startDate') startDate?: string,
  ) {
    const filters = {
      limit: limit ? parseInt(limit, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
    };
    return this.mindTrackService.getEntries(user.sub, filters);
  }

  @Get('entries/:uuid')
  getEntryById(@CurrentUser() user: { sub: string }, @Param('uuid') uuid: string) {
    return this.mindTrackService.getEntryById(uuid, user.sub);
  }

  @Patch('entries/:uuid')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateEntry(@CurrentUser() user: { sub: string }, @Param('uuid') uuid: string, @Body() dto: UpdateEntryDto) {
    return this.mindTrackService.updateEntry(uuid, user.sub, dto);
  }

  @Delete('entries/:uuid')
  deleteEntry(@CurrentUser() user: { sub: string }, @Param('uuid') uuid: string) {
    return this.mindTrackService.deleteEntry(uuid, user.sub);
  }

  @Get('advice/latest')
  getLatestAdvice(@CurrentUser() user: { sub: string }) {
    return this.mindTrackService.getLatestAdvice(user.sub);
  }

  @Post('advice/generate')
  generateAdvice(@CurrentUser() user: { sub: string }) {
    return this.mindTrackService.generateAdvice(user.sub);
  }
}
