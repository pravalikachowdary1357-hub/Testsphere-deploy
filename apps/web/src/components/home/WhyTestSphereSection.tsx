import { Box, Typography } from '@mui/material';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import { brand } from '../../theme/theme';
import { SectionBackground } from './SectionBackground';

const PRINCIPLES = [
  {
    Icon: AccountTreeOutlinedIcon,
    title: 'Traceability by design',
    description:
      'The core value loop — Requirement → Scenario → Case → Execution → Defect → Retest → Release — drives the build order itself, not an afterthought bolted onto a generic issue tracker.',
  },
  {
    Icon: VerifiedUserOutlinedIcon,
    title: 'Compliance from day one',
    description:
      'Audit trail, soft-delete, and versioning are built into the data layer from the first milestone, because retrofitting compliance later is expensive — and risky.',
  },
  {
    Icon: AutoAwesomeOutlinedIcon,
    title: 'AI as a layer, never a dependency',
    description:
      'AI features sit on top of a stable data model and stay strictly opt-in — the core test lifecycle works completely without them.',
  },
  {
    Icon: MapOutlinedIcon,
    title: 'Built in the open',
    description:
      "A public, milestone-by-milestone build roadmap — you can see exactly what's shipped today and what's coming next.",
  },
];

export function WhyTestSphereSection() {
  return (
    <Box
      component="section"
      id="why-testsphere"
      sx={{ position: 'relative', overflow: 'hidden', bgcolor: '#fff', py: { xs: 8, md: 12 } }}
    >
      <SectionBackground variant="light" seed={2} />
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1240, mx: 'auto', px: { xs: 3, sm: 5, md: 6 } }}>
        <Box sx={{ textAlign: 'center', maxWidth: 680, mx: 'auto', mb: 6 }}>
          <Typography variant="overline" sx={{ color: brand.teal, fontWeight: 700, letterSpacing: 1.2 }}>
            Why choose us
          </Typography>
          <Typography sx={{ color: brand.tealDark, fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.2rem' }, mt: 1, mb: 2 }}>
            Principles the build itself is held to
          </Typography>
          <Typography variant="body1" color="text.secondary">
            These aren't marketing lines — they're the guiding principles in our own build
            plan, the same ones that decide what gets built next.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 3,
          }}
        >
          {PRINCIPLES.map(({ Icon, title, description }) => (
            <Box
              key={title}
              sx={{
                display: 'flex',
                gap: 2,
                p: 3,
                borderRadius: 3,
                border: '1px solid rgba(11,36,48,0.08)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: `${brand.amber}1f`,
                  color: brand.amberDark,
                  flexShrink: 0,
                }}
              >
                <Icon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, color: brand.tealDark, mb: 0.5 }}>{title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
