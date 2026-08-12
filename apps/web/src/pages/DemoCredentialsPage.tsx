import { Box, Button, Paper, Typography } from '@mui/material';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import CorporateFareOutlinedIcon from '@mui/icons-material/CorporateFareOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AnimatedAuthBackground } from '../components/AnimatedAuthBackground';
import { brand } from '../theme/theme';
import { ROLE_COLORS } from '../theme/roleColors';

const DEMO_PASSWORD = 'Password123!';

const DEMO_ACCOUNTS = [
  {
    Icon: AdminPanelSettingsOutlinedIcon,
    role: 'Super Admin',
    email: 'admin@example.com',
    description: 'Full system access. Manage organizations, users, products, roles, permissions, and settings.',
    color: ROLE_COLORS['Super Admin'],
  },
  {
    Icon: CorporateFareOutlinedIcon,
    role: 'Organization Admin',
    email: 'orgadmin@example.com',
    description: 'Manage organization users, projects, and testing activities.',
    color: ROLE_COLORS['Organization Admin'],
  },
  {
    Icon: FolderOutlinedIcon,
    role: 'Project Manager',
    email: 'manager@example.com',
    description: 'Create projects, assign testers, monitor execution, and review reports.',
    color: ROLE_COLORS['Project Manager'],
  },
  {
    Icon: AssignmentOutlinedIcon,
    role: 'Test Lead',
    email: 'lead@example.com',
    description: 'Create test plans, review test cases, assign testing tasks, and approve execution.',
    color: ROLE_COLORS['Test Lead'],
  },
  {
    Icon: ScienceOutlinedIcon,
    role: 'Tester',
    email: 'tester@example.com',
    description: 'Execute test cases, report defects, update execution status, and retest fixes.',
    color: ROLE_COLORS.Tester,
  },
  {
    Icon: CodeOutlinedIcon,
    role: 'Developer',
    email: 'developer@example.com',
    description: 'View assigned defects, update bug status, and verify fixes.',
    color: ROLE_COLORS.Developer,
  },
  {
    Icon: VisibilityOutlinedIcon,
    role: 'Client / Viewer',
    email: 'client@example.com',
    description: 'Read-only access to dashboards, reports, and project progress.',
    color: ROLE_COLORS.Viewer,
  },
];

export function DemoCredentialsPage() {
  const navigate = useNavigate();

  const useCredentials = (email: string) => {
    navigate('/login', { state: { demoEmail: email, demoPassword: DEMO_PASSWORD } });
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      <AnimatedAuthBackground />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1100, mx: 'auto', px: { xs: 3, sm: 5, md: 6 }, py: { xs: 6, md: 8 } }}>
        <Button
          component={RouterLink}
          to="/login"
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 3, color: brand.tealDark, fontWeight: 700 }}
        >
          Back to Sign In
        </Button>

        <Box sx={{ textAlign: 'center', maxWidth: 680, mx: 'auto', mb: 5 }}>
          <Typography sx={{ color: brand.tealDark, fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.2rem' }, mb: 1.5 }}>
            Demo Credentials
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Explore TestSphere using pre-configured demo accounts. Select any role below to
            experience the platform with the appropriate permissions.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {DEMO_ACCOUNTS.map(({ Icon, role, email, description, color }) => (
            <Paper
              key={email}
              elevation={0}
              sx={{
                p: 2.75,
                borderRadius: 3,
                border: `1px solid ${color}33`,
                borderLeft: `4px solid ${color}`,
                bgcolor: `${color}0C`,
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 160ms ease, box-shadow 160ms ease',
                '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 10px 24px ${color}26` },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    bgcolor: `${color}1f`,
                    color,
                    flexShrink: 0,
                  }}
                >
                  <Icon sx={{ fontSize: 21 }} />
                </Box>
                <Typography sx={{ fontWeight: 700, color: brand.tealDark }}>{role}</Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                {description}
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <EmailOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: brand.tealDark }}>
                    {email}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <LockOutlinedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: brand.tealDark }}>
                    {DEMO_PASSWORD}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="outlined"
                size="small"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                onClick={() => useCredentials(email)}
                sx={{ borderColor: color, color, '&:hover': { borderColor: color, bgcolor: `${color}14` } }}
              >
                Use these credentials
              </Button>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
