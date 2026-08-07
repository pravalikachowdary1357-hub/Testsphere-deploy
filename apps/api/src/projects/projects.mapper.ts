import type { Project, User } from '@prisma/client';

type ProjectWithManager = Project & {
  projectManager: Pick<User, 'id' | 'fullName' | 'email'> | null;
};

export function toProjectSummary(project: ProjectWithManager) {
  const { projectManager, ...rest } = project;
  return {
    ...rest,
    projectManagerName: projectManager?.fullName ?? null,
    projectManagerEmail: projectManager?.email ?? null,
  };
}
