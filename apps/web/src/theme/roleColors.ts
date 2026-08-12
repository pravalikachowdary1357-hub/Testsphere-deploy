import { brand } from './theme';

// Keyed by the exact Role.name values seeded in apps/api/prisma/seed.ts.
export const ROLE_COLORS: Record<string, string> = {
  'Super Admin': brand.teal,
  'Organization Admin': '#3455DB',
  'Project Manager': brand.amber,
  'Test Lead': '#8B5CF6',
  Tester: '#16A34A',
  Developer: '#F97316',
  Viewer: '#64748B',
};

export function getRoleColor(role?: string | null): string {
  return (role && ROLE_COLORS[role]) || brand.teal;
}
