import { Injectable } from '@nestjs/common';
import { UsersPrismaService, AdminUser } from '@app/prisma-users';

@Injectable()
export class AdminUserRepository {
  constructor(private readonly prisma: UsersPrismaService) {}

  async findByEmail(email: string): Promise<AdminUser | null> {
    return this.prisma.adminUser.findFirst({ where: { email } });
  }
}