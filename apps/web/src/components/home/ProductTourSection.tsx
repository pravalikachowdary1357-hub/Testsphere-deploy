import { Box, Typography } from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import { brand } from '../../theme/theme';
import { SectionBackground } from './SectionBackground';

const STAGES = [
  { Icon: DescriptionOutlinedIcon, label: 'Requirement', description: 'What needs to be true' },
  { Icon: AccountTreeOutlinedIcon, label: 'Test Scenario', description: 'What needs to be verified' },
  { Icon: ChecklistOutlinedIcon, label: 'Test Case', description: 'Exact steps & expected result' },
  { Icon: PlayCircleOutlineOutlinedIcon, label: 'Test Execution', description: 'Run it, log the result' },
  { Icon: BugReportOutlinedIcon, label: 'Defect', description: 'Failures become tracked issues' },
  { Icon: ReplayOutlinedIcon, label: 'Retest', description: 'Fix verified, loop closes' },
  { Icon: RocketLaunchOutlinedIcon, label: 'Release', description: 'Quality score decides go / no-go' },
];

export function ProductTourSection() {
  return (
    <Box
      component="section"
      id="product-tour"
      sx={{ position: 'relative', overflow: 'hidden', bgcolor: brand.skyLight, py: { xs: 8, md: 12 } }}
    >
      <SectionBackground variant="light" seed={1} />
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1240, mx: 'auto', px: { xs: 3, sm: 5, md: 6 } }}>
        <Box sx={{ textAlign: 'center', maxWidth: 680, mx: 'auto', mb: 7 }}>
          <Typography variant="overline" sx={{ color: brand.teal, fontWeight: 700, letterSpacing: 1.2 }}>
            How it works
          </Typography>
          <Typography
            sx={{ color: brand.tealDark, fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.2rem' }, mt: 1, mb: 2 }}
          >
            One chain, seven stages, zero blind spots
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Every entity in TestSphere links back to the last one, so you can walk from any
            requirement all the way to the release it shipped in — and back again.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(7, 1fr)' },
            gap: 3,
          }}
        >
          {STAGES.map(({ Icon, label, description }, index) => (
            <Box key={label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Box
                sx={{
                  position: 'relative',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#fff',
                  border: `2px solid ${brand.teal}`,
                  color: brand.teal,
                  mb: 1.5,
                  boxShadow: '0 2px 10px rgba(11,36,48,0.08)',
                }}
              >
                <Icon sx={{ fontSize: 26 }} />
                <Box
                  sx={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    bgcolor: brand.amberDark,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                  }}
                >
                  {index + 1}
                </Box>
              </Box>
              <Typography sx={{ fontWeight: 700, color: brand.tealDark, fontSize: '0.95rem' }}>{label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, maxWidth: 150 }}>
                {description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
