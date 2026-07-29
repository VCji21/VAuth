import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(
    data: Pick<Prisma.UserCreateInput, 'email' | 'name'>,
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<User> {
    return tx.user.create({ data });
  }
}
