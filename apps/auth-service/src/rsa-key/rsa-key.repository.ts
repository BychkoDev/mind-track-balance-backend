import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { RsaKey } from '@prisma/client';

@Injectable()
export class RsaKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLastRsaKey(): Promise<RsaKey | null> {
    return await this.prisma.rsaKey.findFirst({
      where: { revoked: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNewRsaKey(
    publicKey: string,
    privateKey: string,
    revoked: boolean,
    dateOfRevoked: Date,
  ): Promise<RsaKey> {
    return this.prisma.rsaKey.create({
      data: {
        publicKey,
        privateKey,
        revoked,
        dateOfRevoked,
      },
    });
  }

  async updateRsaKey(uuid: string, data: Partial<RsaKey>): Promise<RsaKey> {
    return await this.prisma.rsaKey.update({
      where: { uuid },
      data,
    });
  }
}
