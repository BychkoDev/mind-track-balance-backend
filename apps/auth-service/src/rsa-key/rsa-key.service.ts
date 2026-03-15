import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { generateKeyPairSync } from 'crypto';
import { RsaKeyRepository } from './rsa-key.repository';
import { RsaKey } from '@app/prisma-auth';

@Injectable()
export class RsaKeyService implements OnModuleInit {
  private readonly logger = new Logger(RsaKeyService.name);
  private publicKey: string;
  private privateKey: string;

  constructor(private readonly repository: RsaKeyRepository) {}

  async getActiveKey(): Promise<RsaKey> {
    const rsaKey = await this.repository.findLastRsaKey();
    if (rsaKey) return rsaKey;
    return await this._generateAndSaveKeys();
  }

  async onModuleInit() {
    this.logger.log('Initializing keys...');

    const keyFromDb = await this.repository.findLastRsaKey();

    if (keyFromDb) {
      this.logger.log('RSA keys found in database.');
      this.publicKey = keyFromDb.publicKey;
      this.privateKey = keyFromDb.privateKey;
    } else {
      this.logger.log('No RSA keys found. Generating a new pair...');
      await this._generateAndSaveKeys();
    }
  }

  private async _generateAndSaveKeys(): Promise<RsaKey> {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    this.publicKey = publicKey;
    this.privateKey = privateKey;

    const dateOfRevoked = new Date();
    dateOfRevoked.setFullYear(dateOfRevoked.getFullYear() + 1);
    const newKey = await this.repository.createNewRsaKey(
      publicKey,
      privateKey,
      false,
      dateOfRevoked,
    );
    this.logger.log('New RSA key pair has been generated and saved.');
    return newKey;
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  getPrivateKey(): string {
    return this.privateKey;
  }
}
