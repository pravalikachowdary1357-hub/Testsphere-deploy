import { Box, Paper, Typography } from '@mui/material';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import CorporateFareOutlinedIcon from '@mui/icons-material/CorporateFareOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { brand } from '../../theme/theme';
import { SectionBackground } from './SectionBackground';

const ROLES = [
  {
    Icon: AdminPanelSettingsOutlinedIcon,
    name: 'Super Admin',
    description: 'Full system access. Manages organizations, users, products, roles, permissions, and settings.',
  },
  {
    Icon: CorporateFareOutlinedIcon,
    name: 'Organization Admin',
    description: 'Manages organization users, projects, and testing activities.',
  },
  {
    Icon: FolderOutlinedIcon,
    name: 'Project Manager',
    description: 'Creates projects, assigns testers, monitors execution, and reviews reports.',
  },
  {
    Icon: AssignmentOutlinedIcon,
    name: 'Test Lead',
    description: 'Creates test plans, reviews test cases, assigns testing tasks, and approves execution.',
  },
  {
    Icon: ScienceOutlinedIcon,
    name: 'Tester',
    description: 'Executes test cases, reports defects, updates execution status, and retests fixes.',
  },
  {
    Icon: CodeOutlinedIcon,
    name: 'Developer',
    description: 'Views assigned defects, updates bug status, and verifies fixes.',
  },
  {
    Icon: VisibilityOutlinedIcon,
    name: 'Client / Viewer',
    description: 'Read-only access to dashboards, reports, and project progress.',
  },
];

export function UserRolesSection() {
  return (
    <Box
      component="section"
      id="roles"
      sx={{ position: 'relative', overflow: 'hidden', bgcolor: brand.skyLight, py: { xs: 8, md: 12 } }}
    >
      <SectionBackground variant="light" seed={1} />
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1240, mx: 'auto', px: { xs: 3, sm: 5, md: 6 } }}>
        <Box sx={{ textAlign: 'center', maxWidth: 680, mx: 'auto', mb: 6 }}>
          <Typography variant="overline" sx={{ color: brand.teal, fontWeight: 700, letterSpacing: 1.2 }}>
            User roles
          </Typography>
          <Typography sx={{ color: brand.tealDark, fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.2rem' }, mt: 1, mb: 2 }}>
            Real RBAC, not a single shared login
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Seven built-in roles map access to responsibility, backed by a permission system
            under the hood — not just a label on a user record.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2.5,
          }}
        >
          {ROLES.map(({ Icon, name, description }) => (
            <Paper
              key={name}
              elevation={0}
              sx={{
                p: 2.75,
                borderRadius: 3,
                border: '1px solid rgba(11,36,48,0.08)',
                bgcolor: '#fff',
                transition: 'transform 160ms ease, box-shadow 160ms ease',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(11,36,48,0.1)' },
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: `${brand.teal}16`,
                  color: brand.teal,
                  mb: 1.5,
                }}
              >
                <Icon sx={{ fontSize: 21 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, color: brand.tealDark, mb: 0.5 }}>{name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
