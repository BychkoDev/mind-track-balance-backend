import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { AuthUser, AuthUserJwtRefreshToken, Role } from '@prisma/client';

@Injectable()
export class AuthUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(
    uuid: string,
    email: string,
    password: string,
    active: boolean,
    serviceCodeUUID: string | null,
    role: Role,
  ) {
    return this.prisma.authUser.create({
      data: {
        uuid,
        email,
        password,
        active,
        serviceCodeUUID,
        role,
        jwtRefreshToken: {
          create: {}
        }
      },
      include: {
        jwtRefreshToken: true
      }
    });
  }

  async findOneByEmail(email: string) {
    return await this.prisma.authUser.findUnique({
      where: { email },
      include: { jwtRefreshToken: true },
    });
  }

  async findOneByUuid(uuid: string) {
    return await this.prisma.authUser.findUnique({
      where: { uuid },
      include: { jwtRefreshToken: true },
    });
  }

  async saveUser(uuid: string, data: Partial<AuthUser>): Promise<AuthUser> {
    return await this.prisma.authUser.update({
      where: { uuid },
      data,
    });
  }

  async upsertRefreshToken(userUuid: string, data: Omit<Partial<AuthUserJwtRefreshToken>, 'userUuid' | 'uuid'>) {
    return await this.prisma.authUserJwtRefreshToken.upsert({
      where: { userUuid },
      update: data,
      create: {
        userUuid,
        ...data,
      },
    });
  }
}

