import type { Defect, Project, Requirement, TestCase, TestExecution, User } from '@prisma/client';

type TestExecutionWithCase = Pick<TestExecution, 'id' | 'code' | 'result'> & {
  testCase: Pick<TestCase, 'id' | 'title' | 'code'>;
};

type DefectWithRelations = Defect & {
  project: Pick<Project, 'id' | 'name' | 'code'>;
  testExecution: TestExecutionWithCase | null;
  requirement: Pick<Requirement, 'id' | 'title' | 'code'> | null;
  reportedBy: Pick<User, 'id' | 'fullName' | 'email'> | null;
  assignedTo: Pick<User, 'id' | 'fullName' | 'email'> | null;
  resolvedBy: Pick<User, 'id' | 'fullName' | 'email'> | null;
};

export function toDefectSummary(defect: DefectWithRelations) {
  const { project, testExecution, requirement, reportedBy, assignedTo, resolvedBy, ...rest } = defect;
  return {
    ...rest,
    projectName: project.name,
    projectCode: project.code,
    testExecutionCode: testExecution?.code ?? null,
    testExecutionResult: testExecution?.result ?? null,
    testCaseTitle: testExecution?.testCase.title ?? null,
    testCaseCode: testExecution?.testCase.code ?? null,
    requirementTitle: requirement?.title ?? null,
    requirementCode: requirement?.code ?? null,
    reportedByName: reportedBy?.fullName ?? null,
    assignedToName: assignedTo?.fullName ?? null,
    resolvedByName: resolvedBy?.fullName ?? null,
  };
}
