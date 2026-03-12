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
import { Role } from '@app/common/enums/role.enum';
import { Roles } from '@app/common/decorators/roles.decorator';
import { MindTrackService } from './mind-track.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';

@Controller('/api/v1/mind-track/entries')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.User, Role.Admin)
export class MindTrackController {
  constructor(private readonly mindTrackService: MindTrackService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  createEntry(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateEntryDto,
  ) {
    return this.mindTrackService.createEntry(req.user.sub, dto);
  }

  @Get()
  getEntries(@Req() req: { user: { sub: string } }) {
    return this.mindTrackService.getEntries(req.user.sub);
  }

  @Get(':uuid')
  getEntryById(
    @Req() req: { user: { sub: string } },
    @Param('uuid') uuid: string,
  ) {
    return this.mindTrackService.getEntryById(uuid, req.user.sub);
  }

  @Patch(':uuid')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateEntry(
    @Req() req: { user: { sub: string } },
    @Param('uuid') uuid: string,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.mindTrackService.updateEntry(uuid, req.user.sub, dto);
  }

  @Delete(':uuid')
  deleteEntry(
    @Req() req: { user: { sub: string } },
    @Param('uuid') uuid: string,
  ) {
    return this.mindTrackService.deleteEntry(uuid, req.user.sub);
  }
}
