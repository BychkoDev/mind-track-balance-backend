import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';

@Injectable()
export class AdviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAdvice(
    userUuid: string,
    content: string,
    relatedTopics: string[],
  ) {
    return await this.prisma.mindTrackAdvice.create({
      data: {
        userUuid,
        content,
        relatedTopics,
      },
    });
  }

  async findAdvices(userUuid: string) {
    return await this.prisma.mindTrackAdvice.findMany({
      where: { userUuid },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(uuid: string, userUuid: string) {
    return await this.prisma.mindTrackAdvice.update({
      where: { uuid, userUuid },
      data: { isRead: true },
    });
  }
}
