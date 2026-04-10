import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { ClientKafka } from '@nestjs/microservices';
import { AuthUserRepository } from './auth-user.repository';
import { SignupDto } from './dto/signup.dto';
import { AuthUser, AuthUserJwtRefreshToken, Role } from '@app/prisma-auth';
import { KAFKA_SERVICE } from '../kafka/auth-kafka.module';

@Injectable()
export class AuthUserService {
  private readonly saltRounds = 12;

  constructor(
    private readonly repository: AuthUserRepository,
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
  ) {}

  async sighup(signupDto: SignupDto) {
    const hashPassword = await this._hashPassword(signupDto.password);
    const serviceCodeUUID = uuidv4();
    const userUUID = uuidv4();
    const user = await this.repository.createUser(
      userUUID,
      signupDto.email,
      hashPassword,
      false,
      serviceCodeUUID,
      Role.USER,
    );

    this.kafkaClient.emit('user_created', {
      uuid: user.uuid,
      email: user.email,
      fullName: signupDto.fullName,
      serviceCodeUUID: user.serviceCodeUUID,
      active: user.active,
      role: user.role,
      createdAt: user.createdAt,
    });
  }

  async createSocialUser(data: { email: string; fullName: string; avatarUrl?: string }) {
    const userUUID = uuidv4();
    const user = await this.repository.createUser(userUUID, data.email, null, true, null, Role.USER);

    this.kafkaClient.emit('user_created', {
      uuid: user.uuid,
      email: user.email,
      fullName: data.fullName,
      avatarUrl: data.avatarUrl,
      serviceCodeUUID: user.serviceCodeUUID,
      active: user.active,
      role: user.role,
      createdAt: user.createdAt,
    });

    return user;
  }

  async validateUser(email: string, password: string): Promise<AuthUser> {
    const user = await this.repository.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Не вірний логін або пароль');
    }
    if (!user.active) {
      throw new UnauthorizedException('Акаунт не активовано');
    }
    if (user.password && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    throw new UnauthorizedException('Не вірний логін або пароль');
  }

  async findUserByUuid(uuid: string) {
    return await this.repository.findOneByUuid(uuid);
  }

  async findOneByEmail(email: string) {
    return await this.repository.findOneByEmail(email);
  }

  async saveUser(user: AuthUser): Promise<AuthUser> {
    return await this.repository.saveUser(user.uuid, user);
  }

  async upsertRefreshToken(userUuid: string, data: Omit<Partial<AuthUserJwtRefreshToken>, 'userUuid' | 'uuid'>) {
    return await this.repository.upsertRefreshToken(userUuid, data);
  }

  private async _hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async onModuleInit() {
    await this.kafkaClient.connect();
  }
}
