import type {
  Project,
  TestCase,
  TestExecution,
  TestPlan,
  TestSuite,
  User,
} from '@prisma/client';

type TestExecutionWithRelations = TestExecution & {
  project: Pick<Project, 'id' | 'name' | 'code'>;
  testCase: Pick<TestCase, 'id' | 'title' | 'code'>;
  testPlan: Pick<TestPlan, 'id' | 'title' | 'code'> | null;
  testSuite: Pick<TestSuite, 'id' | 'name' | 'code'> | null;
  executedBy: Pick<User, 'id' | 'fullName' | 'email'> | null;
};

export function toTestExecutionSummary(execution: TestExecutionWithRelations) {
  const { project, testCase, testPlan, testSuite, executedBy, ...rest } = execution;
  return {
    ...rest,
    projectName: project.name,
    projectCode: project.code,
    testCaseTitle: testCase.title,
    testCaseCode: testCase.code,
    testPlanTitle: testPlan?.title ?? null,
    testPlanCode: testPlan?.code ?? null,
    testSuiteName: testSuite?.name ?? null,
    testSuiteCode: testSuite?.code ?? null,
    executedByName: executedBy?.fullName ?? null,
  };
}
