import { useEffect, useRef } from 'react';
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../theme/theme';
import { ADMIN_NAV_ITEMS } from './adminNav';
import { SidebarBackground } from './SidebarBackground';

export const SIDEBAR_WIDTH = 264;

interface SidebarProps {
  variant: 'permanent' | 'temporary';
  open: boolean;
  onClose: () => void;
}

// AppShell (and this Sidebar with it) remounts on every route change — each
// page renders its own <AppShell> rather than sharing one persistent layout.
// That would otherwise reset the nav list's scroll position on every click;
// persisting it here (outside React state, so it survives the remount) keeps
// scrolling fully under the user's control instead of jumping back to top.
const scrollPositions: Record<SidebarProps['variant'], number> = {
  permanent: 0,
  temporary: 0,
};

export function Sidebar({ variant, open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const listRef = useRef<HTMLUListElement | null>(null);
  const permissions = new Set(user?.permissions ?? []);

  const visibleItems = ADMIN_NAV_ITEMS.filter(
    (item) => !item.permission || permissions.has(item.permission),
  );

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = scrollPositions[variant];
    }
  }, [variant]);

  const content = (
    <Box sx={{ position: 'relative', overflow: 'hidden', width: SIDEBAR_WIDTH, height: '100%' }}>
      <SidebarBackground />
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Toolbar />
        <List
          ref={listRef}
          onScroll={(event) => {
            scrollPositions[variant] = event.currentTarget.scrollTop;
          }}
          sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1.5 }}
        >
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                onClick={variant === 'temporary' ? onClose : undefined}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  mb: 0.25,
                  color: isActive ? brand.teal : 'rgba(11,36,48,0.75)',
                  '&.Mui-selected': { bgcolor: `${brand.teal}1f` },
                  '&.Mui-selected:hover': { bgcolor: `${brand.teal}2c` },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: isActive ? brand.teal : 'inherit' }}>
                  <item.Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { sx: { fontSize: '0.88rem', fontWeight: isActive ? 700 : 500 } } }}
                />
              </ListItemButton>
            );
          })}
        </List>
        <Divider sx={{ borderColor: 'rgba(11,36,48,0.1)' }} />
        <List sx={{ px: 1, py: 1 }}>
          <ListItemButton
            onClick={() => {
              navigate('/login', { replace: true });
              logout();
            }}
            sx={{ borderRadius: 2, color: 'error.main', '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' } }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Logout" slotProps={{ primary: { sx: { fontSize: '0.88rem', fontWeight: 600 } } }} />
          </ListItemButton>
        </List>
      </Box>
    </Box>
  );

  if (variant === 'permanent') {
    return (
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: SIDEBAR_WIDTH, boxSizing: 'border-box', border: 'none', borderRight: '1px solid rgba(11,36,48,0.08)' },
        }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{ [`& .MuiDrawer-paper`]: { width: SIDEBAR_WIDTH, boxSizing: 'border-box' } }}
    >
      {content}
    </Drawer>
  );
}
