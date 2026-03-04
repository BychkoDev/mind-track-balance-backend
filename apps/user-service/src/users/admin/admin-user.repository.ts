import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { AdminUser } from '@prisma/client';

@Injectable()
export class AdminUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findFirst({ where: { email } });
  }
}
