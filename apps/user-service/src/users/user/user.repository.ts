import { Injectable } from '@nestjs/common';
import { UsersPrismaService, User, Locale } from '@app/prisma-users';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: UsersPrismaService) {}

  async createUserProfile(data: { uuid: string; email: string; firstname?: string }): Promise<User> {
    return this.prisma.user.create({
      data: {
        uuid: data.uuid,
        email: data.email,
        firstname: data.firstname,
        login: data.email.split('@')[0],
        about: '',
        vip: false,
        vipExpirationDate: new Date(),
        userIp: '0.0.0.0', 
        active: true,
    });
  }

  async updateSettings(uuid: string, data: { timezone?: string; locale?: Locale }) {
    return this.prisma.user.update({
      where: { uuid },
      data,
    });
  }
}
