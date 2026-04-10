import { Role } from '@app/prisma-users';

export class UserCreatedEvent {
  uuid: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  serviceCodeUUID?: string;
  active: boolean;
  role: Role;
  createdAt: Date;
}
