import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { User } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  // async findByEmail(email: string): Promise<User  | null> {
  //     return this.prisma.user.findFirst({ where: { email } });
  // }
}
