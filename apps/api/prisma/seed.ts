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
  { key: 'requirement:create', description: 'Create requirements within a project' },
  { key: 'requirement:read', description: 'View requirements within an organization' },
  { key: 'requirement:update', description: 'Update, version, and approve requirements' },
  { key: 'requirement:delete', description: 'Delete requirements' },
  { key: 'testplan:create', description: 'Create test plans within a project' },
  { key: 'testplan:read', description: 'View test plans within an organization' },
  { key: 'testplan:update', description: 'Update, version, and approve test plans' },
  { key: 'testplan:delete', description: 'Delete test plans' },
  { key: 'testcase:create', description: 'Create test cases within a project' },
  { key: 'testcase:read', description: 'View test cases within an organization' },
  { key: 'testcase:update', description: 'Update, version, and approve test cases' },
  { key: 'testcase:delete', description: 'Delete test cases' },
  { key: 'testsuite:create', description: 'Create test suites within a project' },
  { key: 'testsuite:read', description: 'View test suites within an organization' },
  { key: 'testsuite:update', description: 'Update test suites and their test case membership' },
  { key: 'testsuite:delete', description: 'Delete test suites' },
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
      'requirement:create', 'requirement:read', 'requirement:update', 'requirement:delete',
      'testplan:create', 'testplan:read', 'testplan:update', 'testplan:delete',
      'testcase:create', 'testcase:read', 'testcase:update', 'testcase:delete',
      'testsuite:create', 'testsuite:read', 'testsuite:update', 'testsuite:delete',
    ],
  },
  {
    name: 'Project Manager',
    description: 'Create projects, assign testers, monitor execution, and review reports.',
    permissionKeys: [
      'user:read', 'role:read', 'permission:read',
      'project:create', 'project:read', 'project:update',
      'product:create', 'product:read', 'product:update',
      'requirement:create', 'requirement:read', 'requirement:update',
      'testplan:create', 'testplan:read', 'testplan:update',
      'testcase:create', 'testcase:read', 'testcase:update',
      'testsuite:create', 'testsuite:read', 'testsuite:update',
    ],
  },
  {
    name: 'Test Lead',
    description: 'Create test plans, review test cases, assign testing tasks, and approve execution.',
    permissionKeys: [
      'user:read', 'role:read', 'permission:read', 'project:read', 'product:read',
      'requirement:read', 'requirement:update',
      'testplan:create', 'testplan:read', 'testplan:update',
      'testcase:read', 'testcase:update',
      'testsuite:create', 'testsuite:read', 'testsuite:update',
    ],
  },
  {
    name: 'Tester',
    description: 'Execute test cases, report defects, update execution status, and retest fixes.',
    permissionKeys: ['user:read', 'project:read', 'product:read', 'requirement:read', 'testplan:read', 'testcase:read', 'testsuite:read'],
  },
  {
    name: 'Developer',
    description: 'View assigned defects, update bug status, and verify fixes.',
    permissionKeys: ['user:read', 'project:read', 'product:read', 'requirement:read', 'testplan:read', 'testcase:read', 'testsuite:read'],
  },
  {
    name: 'Viewer',
    description: 'Read-only access to dashboards, reports, and project progress.',
    permissionKeys: ['user:read', 'project:read', 'product:read', 'requirement:read', 'testplan:read', 'testcase:read', 'testsuite:read'],
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

  console.log('Seeding demo requirements...');
  const testLead = await prisma.user.findUnique({ where: { email: 'lead@example.com' } });
  const demoProject = await prisma.project.findUnique({
    where: { organizationId_code: { organizationId: DEMO_ORG_ID, code: 'PRJ-001' } },
  });
  if (demoProject) {
    await prisma.requirement.upsert({
      where: { projectId_code: { projectId: demoProject.id, code: 'REQ-001' } },
      update: {},
      create: {
        organizationId: DEMO_ORG_ID,
        projectId: demoProject.id,
        title: 'User authentication must support JWT-based sign-in',
        code: 'REQ-001',
        description:
          'Users sign in with email and password and receive a short-lived access token plus a rotating refresh token.',
        type: 'Functional',
        priority: 'Critical',
        status: 'Approved',
        version: 2,
        createdById: projectManager?.id,
        approvedById: testLead?.id,
        approvedAt: new Date('2026-06-10'),
      },
    });
    await prisma.requirement.upsert({
      where: { projectId_code: { projectId: demoProject.id, code: 'REQ-002' } },
      update: {},
      create: {
        organizationId: DEMO_ORG_ID,
        projectId: demoProject.id,
        title: 'System must maintain a full audit trail of all data changes',
        code: 'REQ-002',
        description:
          'Every create, update, and delete across core entities is recorded with actor, timestamp, and what changed.',
        type: 'Non-Functional',
        priority: 'High',
        status: 'In Review',
        createdById: projectManager?.id,
      },
    });
  }

  console.log('Seeding demo test plans...');
  if (demoProject) {
    await prisma.testPlan.upsert({
      where: { projectId_code: { projectId: demoProject.id, code: 'TP-001' } },
      update: {},
      create: {
        organizationId: DEMO_ORG_ID,
        projectId: demoProject.id,
        title: 'Release 4.2 Regression Test Plan',
        code: 'TP-001',
        description:
          'Full regression across authentication, RBAC, and core CRUD modules ahead of the 4.2 release.',
        scope: 'Authentication, role-based access control, and Organization/User/Project/Product/Requirement CRUD.',
        strategy:
          'Risk-based prioritization — Critical and High priority test cases execute first; exploratory testing covers the remainder.',
        entryCriteria: 'All Critical and High priority requirements are Approved; test environment provisioned and stable.',
        exitCriteria: '100% of Critical test cases passed; no open Critical or High defects.',
        environment: 'Staging-2',
        releaseVersion: '4.2',
        status: 'Approved',
        version: 2,
        startDate: new Date('2026-08-18'),
        endDate: new Date('2026-09-02'),
        createdById: testLead?.id,
        approvedById: testLead?.id,
        approvedAt: new Date('2026-08-12'),
      },
    });
    await prisma.testPlan.upsert({
      where: { projectId_code: { projectId: demoProject.id, code: 'TP-002' } },
      update: {},
      create: {
        organizationId: DEMO_ORG_ID,
        projectId: demoProject.id,
        title: 'Sprint 12 Smoke Test Plan',
        code: 'TP-002',
        description: 'Quick smoke pass over the sprint 12 feature set before merging to main.',
        scope: 'Newly shipped Requirement Management module.',
        entryCriteria: 'Sprint 12 branch deployed to Staging-1.',
        exitCriteria: 'No blocking defects on the smoke checklist.',
        environment: 'Staging-1',
        status: 'Draft',
        createdById: testLead?.id,
      },
    });
  }

  console.log('Seeding demo test cases...');
  const tester = await prisma.user.findUnique({ where: { email: 'tester@example.com' } });
  if (demoProject) {
    await prisma.testCase.upsert({
      where: { projectId_code: { projectId: demoProject.id, code: 'TC-001' } },
      update: {},
      create: {
        organizationId: DEMO_ORG_ID,
        projectId: demoProject.id,
        title: 'Verify password reset token expires after 1 hour',
        code: 'TC-001',
        description: 'Confirms an expired reset link can no longer be used to change a password.',
        preconditions: 'A demo user with a valid account exists and password reset is enabled.',
        steps:
          '1. Request a reset link for a valid account\n2. Wait 61 minutes\n3. Attempt to use the reset link',
        expectedResult:
          'The reset link is rejected as expired and the user is prompted to request a new one.',
        testData: 'Demo account: tester@example.com',
        type: 'Regression',
        priority: 'High',
        risk: 'Medium',
        tags: 'auth, regression',
        status: 'Approved',
        version: 3,
        createdById: tester?.id,
        approvedById: testLead?.id,
        approvedAt: new Date('2026-08-05'),
      },
    });
    await prisma.testCase.upsert({
      where: { projectId_code: { projectId: demoProject.id, code: 'TC-002' } },
      update: {},
      create: {
        organizationId: DEMO_ORG_ID,
        projectId: demoProject.id,
        title: 'Verify sign-in issues a valid access and refresh token pair',
        code: 'TC-002',
        description: "Confirms JWT-based sign-in returns both tokens, per REQ-001's requirement.",
        preconditions: 'A demo user with valid credentials exists.',
        steps:
          '1. Submit a valid email and password to the sign-in endpoint\n2. Inspect the response body\n3. Decode the access token payload',
        expectedResult:
          'The response includes a short-lived access token and a rotating refresh token; the access token decodes with the expected claims.',
        testData: 'Demo account: admin@example.com / Password123!',
        type: 'Functional',
        priority: 'Critical',
        risk: 'Medium',
        tags: 'auth, jwt',
        status: 'Ready for Review',
        createdById: tester?.id,
      },
    });
    await prisma.testCase.upsert({
      where: { projectId_code: { projectId: demoProject.id, code: 'TC-003' } },
      update: {},
      create: {
        organizationId: DEMO_ORG_ID,
        projectId: demoProject.id,
        title: 'Verify an audit log entry is recorded when a requirement is updated',
        code: 'TC-003',
        description: "Confirms REQ-002's audit trail guarantee holds for requirement edits.",
        preconditions: 'At least one requirement exists in the project.',
        steps: "1. Edit an existing requirement's status\n2. Open the audit log\n3. Locate the corresponding entry",
        expectedResult: 'An audit log entry exists with the acting user, timestamp, and the fields that changed.',
        type: 'Functional',
        priority: 'Medium',
        risk: 'Low',
        tags: 'audit',
        status: 'Draft',
        createdById: projectManager?.id,
      },
    });
  }

  console.log('Seeding demo test suites...');
  if (demoProject) {
    const tc001 = await prisma.testCase.findUnique({
      where: { projectId_code: { projectId: demoProject.id, code: 'TC-001' } },
    });
    const tc002 = await prisma.testCase.findUnique({
      where: { projectId_code: { projectId: demoProject.id, code: 'TC-002' } },
    });
    const tc003 = await prisma.testCase.findUnique({
      where: { projectId_code: { projectId: demoProject.id, code: 'TC-003' } },
    });

    await prisma.testSuite.upsert({
      where: { projectId_code: { projectId: demoProject.id, code: 'TS-001' } },
      update: {},
      create: {
        organizationId: DEMO_ORG_ID,
        projectId: demoProject.id,
        name: 'Release 4.2 Regression Suite',
        code: 'TS-001',
        description: 'The regression suite executed ahead of every 4.2 release candidate, per TP-001.',
        type: 'Regression',
        status: 'Active',
        createdById: testLead?.id,
        testCases: {
          connect: [tc001, tc002].filter((tc): tc is NonNullable<typeof tc> => Boolean(tc)).map((tc) => ({ id: tc.id })),
        },
      },
    });

    await prisma.testSuite.upsert({
      where: { projectId_code: { projectId: demoProject.id, code: 'TS-002' } },
      update: {},
      create: {
        organizationId: DEMO_ORG_ID,
        projectId: demoProject.id,
        name: 'Sprint 12 Smoke Suite',
        code: 'TS-002',
        description: 'Quick smoke pass over the sprint 12 feature set, per TP-002.',
        type: 'Smoke',
        status: 'Draft',
        createdById: tester?.id,
        testCases: {
          connect: [tc003].filter((tc): tc is NonNullable<typeof tc> => Boolean(tc)).map((tc) => ({ id: tc.id })),
        },
      },
    });
  }

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
