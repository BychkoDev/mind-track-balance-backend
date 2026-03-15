import { Global, Module } from '@nestjs/common';
import { UsersPrismaService } from './prisma.service';

@Global()
@Module({
  providers: [UsersPrismaService],
  exports: [UsersPrismaService],
})
export class UsersPrismaModule {}