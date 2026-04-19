import { Injectable } from '@nestjs/common';
import { MindTrackPrismaService } from '@app/prisma-mind-track';
import { CreateEmotionLogDto } from './dto/create-emotion-log.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';

@Injectable()
export class MindTrackRepository {
  constructor(private readonly prisma: MindTrackPrismaService) {}

  async createEntry(userUuid: string, dto: CreateEmotionLogDto) {
    const { tags, ...rest } = dto;

    return await this.prisma.mindTrackEntry.create({
      data: {
        ...rest,
        userUuid,
        tags:
          tags && tags.length > 0
            ? {
                connectOrCreate: tags.map((tag) => ({
                  where: {
                    userUuid_name: {
                      userUuid,
                      name: tag,
                    },
                  },
                  create: {
                    name: tag,
                    userUuid,
                  },
                })),
              }
            : undefined,
      },
      include: {
        tags: true,
      },
    });
  }

  async findEntries(userUuid: string) {
    return await this.prisma.mindTrackEntry.findMany({
      where: { userUuid },
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findEntryById(uuid: string, userUuid: string) {
    return await this.prisma.mindTrackEntry.findUnique({
      where: { uuid, userUuid },
      include: { tags: true },
    });
  }

  async updateEntry(uuid: string, userUuid: string, dto: UpdateEntryDto) {
    const { tags, ...rest } = dto;

    return await this.prisma.mindTrackEntry.update({
      where: { uuid, userUuid },
      data: {
        ...rest,
        ...(tags
          ? {
              tags: {
                set: [],
                connectOrCreate: tags.map((tag) => ({
                  where: {
                    userUuid_name: {
                      userUuid,
                      name: tag,
                    },
                  },
                  create: {
                    name: tag,
                    userUuid,
                  },
                })),
              },
            }
          : {}),
      },
      include: { tags: true },
    });
  }

  async deleteEntry(uuid: string, userUuid: string) {
    return await this.prisma.mindTrackEntry.delete({
      where: { uuid, userUuid },
    });
  }
}
