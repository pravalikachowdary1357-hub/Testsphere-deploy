import type { Project, Requirement, User } from '@prisma/client';

type RequirementWithRelations = Requirement & {
  project: Pick<Project, 'id' | 'name' | 'code'>;
  createdBy: Pick<User, 'id' | 'fullName' | 'email'> | null;
  approvedBy: Pick<User, 'id' | 'fullName' | 'email'> | null;
};

export function toRequirementSummary(requirement: RequirementWithRelations) {
  const { project, createdBy, approvedBy, ...rest } = requirement;
  return {
    ...rest,
    projectName: project.name,
    projectCode: project.code,
    createdByName: createdBy?.fullName ?? null,
    approvedByName: approvedBy?.fullName ?? null,
  };
}
