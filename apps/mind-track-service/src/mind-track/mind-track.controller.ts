import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role } from '@app/prisma-auth';
import { Roles } from '@app/common/decorators/roles.decorator';
import { MindTrackService } from './mind-track.service';
import { CreateEmotionLogDto } from './dto/create-emotion-log.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';

@Controller('/api/v1/mind-track/entries')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.USER, Role.ADMIN)
export class MindTrackController {
  constructor(private readonly mindTrackService: MindTrackService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  createEntry(@Req() req: { user: { id: string } }, @Body() dto: CreateEmotionLogDto) {
    return this.mindTrackService.createEntry(req.user.id, dto);
  }

  @Get()
  getEntries(@Req() req: { user: { id: string } }) {
    return this.mindTrackService.getEntries(req.user.id);
  }

  @Get(':uuid')
  getEntryById(@Req() req: { user: { id: string } }, @Param('uuid') uuid: string) {
    return this.mindTrackService.getEntryById(uuid, req.user.id);
  }

  @Patch(':uuid')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateEntry(@Req() req: { user: { id: string } }, @Param('uuid') uuid: string, @Body() dto: UpdateEntryDto) {
    return this.mindTrackService.updateEntry(uuid, req.user.id, dto);
  }

  @Delete(':uuid')
  deleteEntry(@Req() req: { user: { id: string } }, @Param('uuid') uuid: string) {
    return this.mindTrackService.deleteEntry(uuid, req.user.id);
  }
}
