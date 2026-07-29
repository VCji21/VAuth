require('dotenv/config');

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const demoClient = {
  name: 'VAuth Demo Web',
  slug: 'vauth-demo-web',
  clientId: 'vauth_demo_web',
  allowedOrigins: ['http://localhost:3000'],
  redirectUris: ['http://localhost:3000/auth/callback'],
};

const permissions = [
  'profile:read',
  'profile:update',
  'admin:read',
  'roles:manage',
  'members:manage',
  'clients:manage',
];

const rolePermissions = {
  owner: permissions,
  admin: ['profile:read', 'admin:read', 'members:manage'],
  member: ['profile:read', 'profile:update'],
};

async function main() {
  const app = await prisma.clientApp.upsert({
    where: { clientId: demoClient.clientId },
    update: {
      name: demoClient.name,
      slug: demoClient.slug,
      allowedOrigins: demoClient.allowedOrigins,
      redirectUris: demoClient.redirectUris,
      status: 'ACTIVE',
    },
    create: demoClient,
  });

  const permissionRows = await Promise.all(
    permissions.map((action) =>
      prisma.permission.upsert({
        where: { appId_action: { appId: app.id, action } },
        update: {},
        create: { appId: app.id, action },
      }),
    ),
  );
  const permissionByAction = new Map(
    permissionRows.map((permission) => [permission.action, permission]),
  );

  for (const [roleName, actions] of Object.entries(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { appId_name: { appId: app.id, name: roleName } },
      update: {},
      create: {
        appId: app.id,
        name: roleName,
        isSystem: true,
      },
    });

    for (const action of actions) {
      const permission = permissionByAction.get(action);
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
