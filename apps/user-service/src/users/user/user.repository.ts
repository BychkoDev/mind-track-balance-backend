import { Injectable } from '@nestjs/common';
import { UsersPrismaService, User, Locale, UserGender, Role } from '@app/prisma-users';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: UsersPrismaService) {}

  async createUserProfile(data: {
    uuid: string;
    email: string;
    fullName?: string;
    avatarUrl?: string;
    active: boolean;
    role: Role;
    createdAt: Date;
  }): Promise<User> {
    const login = data.email.split('@')[0];
    return this.prisma.user.create({
      data: {
        uuid: data.uuid,
        email: data.email,
        fullName: data.fullName,
        avatarUrl: data.avatarUrl,
        login: login,
        about: '',
        vip: false,
        vipExpirationDate: new Date(),
        userIp: '0.0.0.0',
        active: data.active,
        role: data.role,
        createdAt: data.createdAt,
      },
    });
  }

  async findById(uuid: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { uuid },
    });
  }

  async updateSettings(uuid: string, data: { timezone?: string; locale?: Locale }) {
    return this.prisma.user.update({
      where: { uuid },
      data,
    });
  }

  async updateProfile(
    uuid: string,
    data: {
      fullName?: string;
      about?: string;
      gender?: UserGender;
    },
  ) {
    return this.prisma.user.update({
      where: { uuid },
      data,
    });
  }
}
