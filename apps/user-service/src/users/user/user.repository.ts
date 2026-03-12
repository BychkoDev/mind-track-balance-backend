import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { User, Locale } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUserProfile(data: {
    uuid: string;
    email: string;
    firstname?: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        uuid: data.uuid,
        email: data.email,
        firstname: data.firstname,
        login: data.email.split('@')[0], // Generate a default login from email
        about: '',
        vip: false,
        vipExpirationDate: new Date(), // Immediate expiration since false
        userIp: '0.0.0.0', // Default or placeholder
        active: true, // Auto-activate since auth-service manages the real 'active' state
      },
    });
  }

  async updateSettings(
    uuid: string,
    data: { timezone?: string; locale?: Locale },
  ) {
    return this.prisma.user.update({
      where: { uuid },
      data,
    });
  }
}
