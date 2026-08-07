import { Box, Typography } from '@mui/material';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { brand } from '../../theme/theme';
import { SectionBackground } from './SectionBackground';

const STATS = [
  { Icon: AccountTreeOutlinedIcon, value: '7', label: 'stages in the traceability chain' },
  { Icon: GroupsOutlinedIcon, value: '7', label: 'built-in roles, Viewer to Super Admin' },
  { Icon: MapOutlinedIcon, value: '14', label: 'milestones on the public build roadmap' },
  { Icon: ShieldOutlinedIcon, value: 'JWT · RBAC', label: 'protecting every session and route' },
];

export function StatisticsSection() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${brand.tealDark} 0%, ${brand.tealDarker} 100%)`,
        py: { xs: 7, md: 9 },
      }}
    >
      <SectionBackground variant="dark" seed={0} />
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1240,
          mx: 'auto',
          px: { xs: 3, sm: 5, md: 6 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
          gap: { xs: 4, sm: 3 },
        }}
      >
        {STATS.map(({ Icon, value, label }) => (
          <Box key={label} sx={{ textAlign: 'center' }}>
            <Icon sx={{ fontSize: 26, color: brand.amberLight, mb: 1 }} />
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.9rem' }, color: '#fff', lineHeight: 1.1 }}>
              {value}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
