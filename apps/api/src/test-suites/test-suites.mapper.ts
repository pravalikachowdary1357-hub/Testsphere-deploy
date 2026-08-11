import type { Project, TestCase, TestSuite, User } from '@prisma/client';

type TestSuiteWithRelations = TestSuite & {
  project: Pick<Project, 'id' | 'name' | 'code'>;
  createdBy: Pick<User, 'id' | 'fullName' | 'email'> | null;
  testCases: Array<Pick<TestCase, 'id' | 'title' | 'code' | 'status'>>;
};

export function toTestSuiteSummary(testSuite: TestSuiteWithRelations) {
  const { project, createdBy, testCases, ...rest } = testSuite;
  return {
    ...rest,
    projectName: project.name,
    projectCode: project.code,
    createdByName: createdBy?.fullName ?? null,
    testCaseCount: testCases.length,
    testCases,
  };
}
