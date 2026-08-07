import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Permission keys are "resource:action". Scoped to what's actually built so far
// (auth/users/roles/permissions) — expand this list as later milestones add
// resources (requirement, testcase, defect, ...).
const PERMISSIONS: Array<{ key: string; description: string }> = [
  { key: 'user:create', description: 'Create users within an organization' },
  { key: 'user:read', description: 'View users within an organization' },
  { key: 'user:update', description: 'Update users within an organization' },
  { key: 'user:delete', description: 'Deactivate users within an organization' },
  { key: 'role:create', description: 'Create roles' },
  { key: 'role:read', description: 'View roles and their permissions' },
  { key: 'role:update', description: 'Update roles and their permission assignments' },
  { key: 'role:delete', description: 'Delete roles' },
  { key: 'permission:create', description: 'Create permissions' },
  { key: 'permission:read', description: 'View permissions' },
  { key: 'organization:create', description: 'Create organizations' },
  { key: 'organization:read', description: 'View organizations' },
  { key: 'organization:update', description: 'Update organizations' },
  { key: 'organization:delete', description: 'Delete organizations' },
  { key: 'audit:read', description: 'View the system audit log' },
  { key: 'project:create', description: 'Create projects within an organization' },
  { key: 'project:read', description: 'View projects within an organization' },
  { key: 'project:update', description: 'Update projects within an organization' },
  { key: 'project:delete', description: 'Delete projects within an organization' },
  { key: 'product:create', description: 'Create products within an organization' },
  { key: 'product:read', description: 'View products within an organization' },
  { key: 'product:update', description: 'Update products within an organization' },
  { key: 'product:delete', description: 'Delete products within an organization' },
];

const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

// Default roles from the requirements spec (§2), with permission sets scoped to
// what exists today — everything else (test plans, cases, defects, ...) will
// gain more permissions once those modules land.
const ROLES: Array<{ name: string; description: string; permissionKeys: string[] }> = [
  {
    name: 'Super Admin',
    description: 'Full system access. Manage organizations, users, products, roles, permissions, and settings.',
    permissionKeys: ALL_PERMISSION_KEYS,
  },
  {
    name: 'Organization Admin',
    description: 'Manage organization users, projects, and testing activities.',
    permissionKeys: [
      'user:create', 'user:read', 'user:update', 'user:delete',
      'role:read', 'permission:read',
      'project:create', 'project:read', 'project:update', 'project:delete',
      'product:create', 'product:read', 'product:update', 'product:delete',
    ],
  },
  {
    name: 'Project Manager',
    description: 'Create projects, assign testers, monitor execution, and review reports.',
    permissionKeys: [
      'user:read', 'role:read', 'permission:read',
      'project:create', 'project:read', 'project:update',
      'product:create', 'product:read', 'product:update',
    ],
  },
  {
    name: 'Test Lead',
    description: 'Create test plans, review test cases, assign testing tasks, and approve execution.',
    permissionKeys: ['user:read', 'role:read', 'permission:read', 'project:read', 'product:read'],
  },
  {
    name: 'Tester',
    description: 'Execute test cases, report defects, update execution status, and retest fixes.',
    permissionKeys: ['user:read', 'project:read', 'product:read'],
  },
  {
    name: 'Developer',
    description: 'View assigned defects, update bug status, and verify fixes.',
    permissionKeys: ['user:read', 'project:read', 'product:read'],
  },
  {
    name: 'Viewer',
    description: 'Read-only access to dashboards, reports, and project progress.',
    permissionKeys: ['user:read', 'project:read', 'product:read'],
  },
];

// Superseded by the Project Manager / Test Lead split above — dropped instead
// of left dangling, since nothing has ever been assigned this role.
const RETIRED_ROLE_NAMES = ['Test Manager'];

const DEMO_ORG_ID = 'demo-org';
const DEMO_ORG_NAME = 'Demo Org';
const DEMO_PASSWORD = 'Password123!';

const DEMO_USERS: Array<{ email: string; fullName: string; roleName: string }> = [
  { email: 'admin@example.com', fullName: 'Demo Admin', roleName: 'Super Admin' },
  { email: 'orgadmin@example.com', fullName: 'Demo Org Admin', roleName: 'Organization Admin' },
  { email: 'manager@example.com', fullName: 'Demo Project Manager', roleName: 'Project Manager' },
  { email: 'lead@example.com', fullName: 'Demo Test Lead', roleName: 'Test Lead' },
  { email: 'tester@example.com', fullName: 'Test Tester', roleName: 'Tester' },
  { email: 'developer@example.com', fullName: 'Demo Developer', roleName: 'Developer' },
  { email: 'client@example.com', fullName: 'Demo Client', roleName: 'Viewer' },
];

async function main() {
  console.log('Seeding permissions...');
  const permissionsByKey = new Map<string, string>();
  for (const permission of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
    permissionsByKey.set(record.key, record.id);
  }

  console.log('Seeding roles...');
  for (const role of ROLES) {
    const record = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });

    const permissionIds = role.permissionKeys.map((key) => {
      const id = permissionsByKey.get(key);
      if (!id) {
        throw new Error(`Seed error: role "${role.name}" references unknown permission "${key}"`);
      }
      return id;
    });

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: record.id } }),
      prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId: record.id, permissionId })),
      }),
    ]);
  }

  console.log('Removing retired roles...');
  await prisma.role.deleteMany({ where: { name: { in: RETIRED_ROLE_NAMES } } });

  console.log('Seeding demo organization...');
  await prisma.organization.upsert({
    where: { id: DEMO_ORG_ID },
    update: {},
    create: {
      id: DEMO_ORG_ID,
      name: DEMO_ORG_NAME,
      code: 'ORG-001',
      status: 'Active',
      licenseStatus: 'Licensed',
      adminName: 'Demo Admin',
      adminEmail: 'admin@example.com',
      adminPhone: '+91 90000 00001',
    },
  });

  console.log('Seeding demo users...');
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? '10');
  const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, saltRounds);

  for (const demoUser of DEMO_USERS) {
    const role = await prisma.role.findUnique({ where: { name: demoUser.roleName } });
    if (!role) {
      throw new Error(`Seed error: demo user "${demoUser.email}" references unknown role "${demoUser.roleName}"`);
    }

    const user = await prisma.user.upsert({
      where: { email: demoUser.email },
      update: {},
      create: {
        email: demoUser.email,
        passwordHash: demoPasswordHash,
        fullName: demoUser.fullName,
        organizationId: DEMO_ORG_ID,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
  }

  console.log('Seeding demo project...');
  const projectManager = await prisma.user.findUnique({ where: { email: 'manager@example.com' } });
  await prisma.project.upsert({
    where: { organizationId_code: { organizationId: DEMO_ORG_ID, code: 'PRJ-001' } },
    update: {},
    create: {
      organizationId: DEMO_ORG_ID,
      name: 'TestSphere Platform',
      code: 'PRJ-001',
      description: 'The TestSphere QA platform itself — dogfooding our own test management as we build it.',
      status: 'Active',
      startDate: new Date('2026-06-01'),
      projectManagerId: projectManager?.id,
    },
  });

  console.log('Seeding demo product...');
  await prisma.product.upsert({
    where: { organizationId_code: { organizationId: DEMO_ORG_ID, code: 'PROD-001' } },
    update: {},
    create: {
      organizationId: DEMO_ORG_ID,
      name: 'TestSphere Web App',
      code: 'PROD-001',
      description: 'The web application under test — the same app this platform is built as.',
      version: '0.1.0',
      status: 'Active',
      productOwnerId: projectManager?.id,
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
