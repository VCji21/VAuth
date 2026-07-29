import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppStatus, ClientApp } from '@prisma/client';
import * as argon2 from 'argon2';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientAppDto } from './dto/create-client-app.dto';
import { UpdateClientAppDto } from './dto/update-client-app.dto';

type PublicClientApp = Omit<ClientApp, 'clientSecretHash'>;

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateClientAppDto): Promise<PublicClientApp> {
    this.validateOriginAndRedirects(dto.allowedOrigins, dto.redirectUris);

    const existing = await this.prisma.clientApp.findFirst({
      where: { OR: [{ slug: dto.slug }, { clientId: dto.clientId }] },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Client app already exists');
    }

    const app = await this.prisma.clientApp.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        clientId: dto.clientId,
        clientSecretHash: dto.clientSecret
          ? await argon2.hash(dto.clientSecret, { type: argon2.argon2id })
          : undefined,
        allowedOrigins: dto.allowedOrigins,
        redirectUris: dto.redirectUris,
      },
    });

    await this.audit.record({
      appId: app.id,
      event: 'client.created',
      metadata: { clientId: app.clientId },
    });

    return this.toPublicClient(app);
  }

  async findAll(): Promise<PublicClientApp[]> {
    const apps = await this.prisma.clientApp.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return apps.map((app) => this.toPublicClient(app));
  }

  async findById(id: string): Promise<PublicClientApp> {
    const app = await this.prisma.clientApp.findUnique({ where: { id } });
    if (!app) {
      throw new NotFoundException('Client app not found');
    }
    return this.toPublicClient(app);
  }

  async findActiveByClientId(clientId: string): Promise<ClientApp> {
    const app = await this.prisma.clientApp.findUnique({ where: { clientId } });
    if (!app || app.status !== AppStatus.ACTIVE) {
      throw new NotFoundException('Client app not found');
    }
    return app;
  }

  async update(id: string, dto: UpdateClientAppDto): Promise<PublicClientApp> {
    const current = await this.prisma.clientApp.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException('Client app not found');
    }

    const allowedOrigins = dto.allowedOrigins ?? current.allowedOrigins;
    const redirectUris = dto.redirectUris ?? current.redirectUris;
    this.validateOriginAndRedirects(allowedOrigins, redirectUris);

    const updated = await this.prisma.clientApp.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        clientId: dto.clientId,
        clientSecretHash: dto.clientSecret
          ? await argon2.hash(dto.clientSecret, { type: argon2.argon2id })
          : undefined,
        allowedOrigins: dto.allowedOrigins,
        redirectUris: dto.redirectUris,
        status: dto.status,
      },
    });

    await this.audit.record({
      appId: updated.id,
      event: 'client.updated',
      metadata: { clientId: updated.clientId, status: updated.status },
    });

    return this.toPublicClient(updated);
  }

  async disable(id: string): Promise<PublicClientApp> {
    return this.update(id, { status: 'DISABLED' });
  }

  validateRedirectUri(app: ClientApp, redirectUri: string): void {
    if (!app.redirectUris.includes(redirectUri)) {
      throw new BadRequestException('Invalid redirect URI');
    }
  }

  private validateOriginAndRedirects(
    allowedOrigins: string[],
    redirectUris: string[],
  ): void {
    for (const redirectUri of redirectUris) {
      const redirect = new URL(redirectUri);
      const redirectOrigin = redirect.origin;
      if (!allowedOrigins.includes(redirectOrigin)) {
        throw new BadRequestException(
          'Redirect URI origin must be in allowed origins',
        );
      }
    }
  }

  private toPublicClient(app: ClientApp): PublicClientApp {
    const { clientSecretHash: _clientSecretHash, ...publicApp } = app;
    return publicApp;
  }
}
