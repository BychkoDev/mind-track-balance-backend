import { Module } from '@nestjs/common';
import { RsaKeyService } from './rsa-key.service';
import { RsaKeyRepository } from './rsa-key.repository';
import { WellKnownController } from './well-known.controller';

@Module({
  providers: [RsaKeyService, RsaKeyRepository],
  controllers: [WellKnownController],
  exports: [RsaKeyService],
})
export class RsaKeyModule {}
