import type { Project, TestCase, User } from '@prisma/client';

type TestCaseWithRelations = TestCase & {
  project: Pick<Project, 'id' | 'name' | 'code'>;
  createdBy: Pick<User, 'id' | 'fullName' | 'email'> | null;
  approvedBy: Pick<User, 'id' | 'fullName' | 'email'> | null;
};

export function toTestCaseSummary(testCase: TestCaseWithRelations) {
  const { project, createdBy, approvedBy, ...rest } = testCase;
  return {
    ...rest,
    projectName: project.name,
    projectCode: project.code,
    createdByName: createdBy?.fullName ?? null,
    approvedByName: approvedBy?.fullName ?? null,
  };
}
