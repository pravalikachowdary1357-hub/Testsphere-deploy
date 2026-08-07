import { Box, Chip, Paper, Typography } from '@mui/material';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import type SvgIcon from '@mui/material/SvgIcon';
import { AppShell } from '../components/AppShell';
import { brand } from '../theme/theme';

interface ComingSoonPageProps {
  title: string;
  Icon: typeof SvgIcon;
  description: string;
}

export function ComingSoonPage({ title, Icon, description }: ComingSoonPageProps) {
  return (
    <AppShell title={title}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid rgba(11,36,48,0.08)',
          p: { xs: 4, md: 6 },
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: `${brand.teal}12`,
            color: brand.teal,
            mb: 2,
          }}
        >
          <Icon sx={{ fontSize: 30 }} />
        </Box>
        <Chip
          label="On the roadmap"
          size="small"
          icon={<MapOutlinedIcon sx={{ fontSize: 14 }} />}
          sx={{ mb: 2, fontWeight: 700, bgcolor: `${brand.amber}20`, color: brand.amberDark }}
        />
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto' }}>
          {description}
        </Typography>
      </Paper>
    </AppShell>
  );
}
