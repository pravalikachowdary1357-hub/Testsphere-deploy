import type { Project, Requirement, TestCase, User } from '@prisma/client';

type TestCaseWithRelations = TestCase & {
  project: Pick<Project, 'id' | 'name' | 'code'>;
  requirement: Pick<Requirement, 'id' | 'title' | 'code'> | null;
  createdBy: Pick<User, 'id' | 'fullName' | 'email'> | null;
  approvedBy: Pick<User, 'id' | 'fullName' | 'email'> | null;
};

export function toTestCaseSummary(testCase: TestCaseWithRelations) {
  const { project, requirement, createdBy, approvedBy, ...rest } = testCase;
  return {
    ...rest,
    projectName: project.name,
    projectCode: project.code,
    requirementTitle: requirement?.title ?? null,
    requirementCode: requirement?.code ?? null,
    createdByName: createdBy?.fullName ?? null,
    approvedByName: approvedBy?.fullName ?? null,
  };
}
