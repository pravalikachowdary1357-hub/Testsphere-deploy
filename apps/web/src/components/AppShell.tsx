import { useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material';
import { keyframes } from '@emotion/react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import LockResetIcon from '@mui/icons-material/LockReset';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getRoleColor } from '../theme/roleColors';
import { Sidebar, SIDEBAR_WIDTH } from './Sidebar';
import { TestSphereLogoMark } from './TestSphereLogoMark';

// A small "live session" pulse on the avatar badge — the same active/passing
// status language TestSphere uses elsewhere, borrowed here for "you're signed in".
const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(61, 220, 132, 0.55); }
  50% { box-shadow: 0 0 0 4px rgba(61, 220, 132, 0); }
`;

function getInitials(fullName: string | undefined): string {
  if (!fullName) {
    return '?';
  }
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

interface AppShellProps {
  title?: string;
  children: ReactNode;
}

export function AppShell({ title, children }: AppShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const roleColor = getRoleColor(user?.roles?.[0]);

  const openMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" color="primary" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileNavOpen(true)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, display: 'inline-flex' }}>
            <TestSphereLogoMark height={30} onDark />
          </Box>

          <Button color="inherit" onClick={openMenu} endIcon={<KeyboardArrowDownIcon />} sx={{ textTransform: 'none' }}>
            <Box sx={{ position: 'relative', display: 'inline-flex', mr: 1 }}>
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  fontSize: 14,
                  bgcolor: 'secondary.main',
                  color: 'secondary.contrastText',
                }}
              >
                {getInitials(user?.fullName)}
              </Avatar>
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  bgcolor: '#3DDC84',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  animation: `${pulse} 2.4s ease-in-out infinite`,
                  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
              />
            </Box>
            {user?.fullName}
          </Button>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
            <MenuItem
              onClick={() => {
                closeMenu();
                navigate('/profile');
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              My Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeMenu();
                navigate('/change-password');
              }}
            >
              <ListItemIcon>
                <LockResetIcon fontSize="small" />
              </ListItemIcon>
              Change Password
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                closeMenu();
                navigate('/login', { replace: true });
                logout();
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Log out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: { md: 'none' } }}>
        <Sidebar variant="temporary" open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar variant="permanent" open onClose={() => {}} />
      </Box>

      <Box
        component="main"
        sx={{
          ml: { md: `${SIDEBAR_WIDTH}px` },
        }}
      >
        <Toolbar />
        <Container sx={{ py: 6 }}>
          {title && (
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 4,
                pb: 1.5,
                display: 'inline-block',
                borderBottom: `3px solid ${roleColor}`,
              }}
            >
              {title}
            </Typography>
          )}
          {children}
        </Container>
      </Box>
    </Box>
  );
}
