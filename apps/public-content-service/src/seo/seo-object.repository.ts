import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';

@Injectable()
export class SeoObjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  // async findByEmail(email: string): Promise<User  | null> {
  //     return this.adminUserRepository.findOne({ where: { email } });
  // }
  //
  // async rawSQLExample(): Promise<any> {
  //     return this.authUserRepository.query('SELECT * FROM auth_users WHERE is_active = $1', [true]);
  // }
}
