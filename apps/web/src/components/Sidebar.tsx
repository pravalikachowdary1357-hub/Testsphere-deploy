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
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { brand } from '../theme/theme';
import { ADMIN_NAV_ITEMS } from './adminNav';

export const SIDEBAR_WIDTH = 264;

interface SidebarProps {
  variant: 'permanent' | 'temporary';
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ variant, open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const permissions = new Set(user?.permissions ?? []);

  const visibleItems = ADMIN_NAV_ITEMS.filter(
    (item) => !item.permission || permissions.has(item.permission),
  );

  const content = (
    <Box sx={{ width: SIDEBAR_WIDTH, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar />
      <List sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1.5 }}>
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
                '&.Mui-selected': { bgcolor: `${brand.teal}14` },
                '&.Mui-selected:hover': { bgcolor: `${brand.teal}1f` },
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
      <Divider />
      <List sx={{ px: 1, py: 1 }}>
        <ListItemButton onClick={() => logout()} sx={{ borderRadius: 2, color: 'error.main' }}>
          <ListItemIcon sx={{ minWidth: 36, color: 'error.main' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" slotProps={{ primary: { sx: { fontSize: '0.88rem', fontWeight: 600 } } }} />
        </ListItemButton>
      </List>
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
