import { Injectable } from '@nestjs/common';
import { Credential, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CredentialsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPasswordCredential(
    input: { userId: string; password: string },
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<Credential> {
    return tx.credential.create({
      data: {
        userId: input.userId,
        passwordHash: await argon2.hash(input.password, {
          type: argon2.argon2id,
        }),
      },
    });
  }

  verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
