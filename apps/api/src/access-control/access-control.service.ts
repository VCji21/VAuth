import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class AccessControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getAppOrThrow(clientId: string): Promise<{ id: string; clientId: string }> {
    const app = await this.prisma.clientApp.findUnique({
      where: { clientId },
      select: { id: true, clientId: true },
    });
    if (!app) {
      throw new NotFoundException('Client app not found');
    }
    return app;
  }

  async createRole(clientId: string, dto: CreateRoleDto) {
    const app = await this.getAppOrThrow(clientId);
    const existing = await this.prisma.role.findUnique({
      where: { appId_name: { appId: app.id, name: dto.name } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Role already exists');
    }
    const role = await this.prisma.role.create({
      data: {
        appId: app.id,
        name: dto.name,
        description: dto.description,
        isSystem: dto.isSystem ?? false,
      },
    });
    await this.audit.record({
      appId: app.id,
      event: 'role.created',
      metadata: { role: role.name },
    });
    return role;
  }

  async listRoles(clientId: string) {
    const app = await this.getAppOrThrow(clientId);
    return this.prisma.role.findMany({
      where: { appId: app.id },
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async updateRole(clientId: string, roleId: string, dto: UpdateRoleDto) {
    const app = await this.getAppOrThrow(clientId);
    const role = await this.prisma.role.update({
      where: { id: roleId, appId: app.id },
      data: dto,
    });
    await this.audit.record({
      appId: app.id,
      event: 'role.updated',
      metadata: { roleId },
    });
    return role;
  }

  async deleteRole(clientId: string, roleId: string) {
    const app = await this.getAppOrThrow(clientId);
    await this.prisma.role.delete({ where: { id: roleId, appId: app.id } });
    await this.audit.record({
      appId: app.id,
      event: 'role.deleted',
      metadata: { roleId },
    });
    return { deleted: true };
  }

  async createPermission(clientId: string, dto: CreatePermissionDto) {
    const app = await this.getAppOrThrow(clientId);
    const existing = await this.prisma.permission.findUnique({
      where: { appId_action: { appId: app.id, action: dto.action } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Permission already exists');
    }
    const permission = await this.prisma.permission.create({
      data: {
        appId: app.id,
        action: dto.action,
        description: dto.description,
      },
    });
    await this.audit.record({
      appId: app.id,
      event: 'permission.created',
      metadata: { permission: permission.action },
    });
    return permission;
  }

  async listPermissions(clientId: string) {
    const app = await this.getAppOrThrow(clientId);
    return this.prisma.permission.findMany({
      where: { appId: app.id },
      orderBy: { action: 'asc' },
    });
  }

  async updatePermission(
    clientId: string,
    permissionId: string,
    dto: UpdatePermissionDto,
  ) {
    const app = await this.getAppOrThrow(clientId);
    const permission = await this.prisma.permission.update({
      where: { id: permissionId, appId: app.id },
      data: dto,
    });
    await this.audit.record({
      appId: app.id,
      event: 'permission.updated',
      metadata: { permissionId },
    });
    return permission;
  }

  async deletePermission(clientId: string, permissionId: string) {
    const app = await this.getAppOrThrow(clientId);
    await this.prisma.permission.delete({
      where: { id: permissionId, appId: app.id },
    });
    await this.audit.record({
      appId: app.id,
      event: 'permission.deleted',
      metadata: { permissionId },
    });
    return { deleted: true };
  }

  async addRolePermission(
    clientId: string,
    roleId: string,
    permissionId: string,
  ) {
    const app = await this.getAppOrThrow(clientId);
    await this.ensureRoleAndPermissionBelongToApp(app.id, roleId, permissionId);
    return this.prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId },
    });
  }

  async removeRolePermission(
    clientId: string,
    roleId: string,
    permissionId: string,
  ) {
    const app = await this.getAppOrThrow(clientId);
    await this.ensureRoleAndPermissionBelongToApp(app.id, roleId, permissionId);
    await this.prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    return { deleted: true };
  }

  async listMemberships(clientId: string) {
    const app = await this.getAppOrThrow(clientId);
    return this.prisma.appMembership.findMany({
      where: { appId: app.id },
      include: {
        user: { select: { id: true, email: true, name: true, status: true } },
        roles: { include: { role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async replaceMembershipRoles(
    clientId: string,
    membershipId: string,
    roleIds: string[],
  ) {
    const app = await this.getAppOrThrow(clientId);
    const membership = await this.prisma.appMembership.findUnique({
      where: { id: membershipId, appId: app.id },
      select: { id: true },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    const roles = await this.prisma.role.findMany({
      where: { appId: app.id, id: { in: roleIds } },
      select: { id: true },
    });
    if (roles.length !== roleIds.length) {
      throw new NotFoundException('Role not found');
    }

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { membershipId } }),
      this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ membershipId, roleId })),
        skipDuplicates: true,
      }),
    ]);

    await this.audit.record({
      appId: app.id,
      event: 'membership.roles.updated',
      metadata: { membershipId, roleIds },
    });

    return this.prisma.appMembership.findUnique({
      where: { id: membershipId },
      include: { roles: { include: { role: true } } },
    });
  }

  async deleteMembership(clientId: string, membershipId: string) {
    const app = await this.getAppOrThrow(clientId);
    await this.prisma.appMembership.delete({
      where: { id: membershipId, appId: app.id },
    });
    await this.audit.record({
      appId: app.id,
      event: 'membership.deleted',
      metadata: { membershipId },
    });
    return { deleted: true };
  }

  private async ensureRoleAndPermissionBelongToApp(
    appId: string,
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    const [role, permission] = await Promise.all([
      this.prisma.role.findUnique({
        where: { id: roleId, appId },
        select: { id: true },
      }),
      this.prisma.permission.findUnique({
        where: { id: permissionId, appId },
        select: { id: true },
      }),
    ]);

    if (!role || !permission) {
      throw new NotFoundException('Role or permission not found');
    }
  }
}
