import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { RolesGuard } from '@app/common/guards/roles.guard';

@Module({
  providers: [CommonService, RolesGuard],
  exports: [CommonService, RolesGuard],
})
export class CommonModule {}
