import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AccessControlService } from './access-control.service';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('clients/:clientId')
export class AccessControlController {
  constructor(private readonly accessControl: AccessControlService) {}

  @Post('roles')
  @RequirePermissions('roles:manage')
  createRole(@Param('clientId') clientId: string, @Body() dto: CreateRoleDto) {
    return this.accessControl.createRole(clientId, dto);
  }

  @Get('roles')
  @RequirePermissions('roles:manage')
  listRoles(@Param('clientId') clientId: string) {
    return this.accessControl.listRoles(clientId);
  }

  @Patch('roles/:roleId')
  @RequirePermissions('roles:manage')
  updateRole(
    @Param('clientId') clientId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.accessControl.updateRole(clientId, roleId, dto);
  }

  @Delete('roles/:roleId')
  @RequirePermissions('roles:manage')
  deleteRole(@Param('clientId') clientId: string, @Param('roleId') roleId: string) {
    return this.accessControl.deleteRole(clientId, roleId);
  }

  @Post('permissions')
  @RequirePermissions('roles:manage')
  createPermission(
    @Param('clientId') clientId: string,
    @Body() dto: CreatePermissionDto,
  ) {
    return this.accessControl.createPermission(clientId, dto);
  }

  @Get('permissions')
  @RequirePermissions('roles:manage')
  listPermissions(@Param('clientId') clientId: string) {
    return this.accessControl.listPermissions(clientId);
  }

  @Patch('permissions/:permissionId')
  @RequirePermissions('roles:manage')
  updatePermission(
    @Param('clientId') clientId: string,
    @Param('permissionId') permissionId: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.accessControl.updatePermission(clientId, permissionId, dto);
  }

  @Delete('permissions/:permissionId')
  @RequirePermissions('roles:manage')
  deletePermission(
    @Param('clientId') clientId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.accessControl.deletePermission(clientId, permissionId);
  }

  @Post('roles/:roleId/permissions/:permissionId')
  @RequirePermissions('roles:manage')
  addRolePermission(
    @Param('clientId') clientId: string,
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.accessControl.addRolePermission(clientId, roleId, permissionId);
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  @RequirePermissions('roles:manage')
  removeRolePermission(
    @Param('clientId') clientId: string,
    @Param('roleId') roleId: string,
    @Param('permissionId') permissionId: string,
  ) {
    return this.accessControl.removeRolePermission(clientId, roleId, permissionId);
  }

  @Get('memberships')
  @RequirePermissions('members:manage')
  listMemberships(@Param('clientId') clientId: string) {
    return this.accessControl.listMemberships(clientId);
  }

  @Patch('memberships/:membershipId/roles')
  @RequirePermissions('members:manage')
  replaceMembershipRoles(
    @Param('clientId') clientId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: AssignRolesDto,
  ) {
    return this.accessControl.replaceMembershipRoles(
      clientId,
      membershipId,
      dto.roleIds,
    );
  }

  @Delete('memberships/:membershipId')
  @RequirePermissions('members:manage')
  deleteMembership(
    @Param('clientId') clientId: string,
    @Param('membershipId') membershipId: string,
  ) {
    return this.accessControl.deleteMembership(clientId, membershipId);
  }
}
