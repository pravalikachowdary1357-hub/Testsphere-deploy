import type { Project, TestPlan, User } from '@prisma/client';

type TestPlanWithRelations = TestPlan & {
  project: Pick<Project, 'id' | 'name' | 'code'>;
  createdBy: Pick<User, 'id' | 'fullName' | 'email'> | null;
  approvedBy: Pick<User, 'id' | 'fullName' | 'email'> | null;
};

export function toTestPlanSummary(testPlan: TestPlanWithRelations) {
  const { project, createdBy, approvedBy, ...rest } = testPlan;
  return {
    ...rest,
    projectName: project.name,
    projectCode: project.code,
    createdByName: createdBy?.fullName ?? null,
    approvedByName: approvedBy?.fullName ?? null,
  };
}
