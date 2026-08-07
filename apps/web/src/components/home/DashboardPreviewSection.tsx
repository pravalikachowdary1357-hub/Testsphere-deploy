import { Box, Chip, Paper, Typography } from '@mui/material';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import { brand } from '../../theme/theme';
import { SectionBackground } from './SectionBackground';

const WINDOW_DOTS = ['#EF6B5F', '#F5BD52', '#61C554'];

const KPI_DONUTS = [
  { label: 'Requirement coverage', value: 78, color: brand.teal },
  { label: 'Pass rate', value: 91, color: '#2e7d32' },
];

const STATUS_BREAKDOWN = [
  { label: 'Pass', value: 91, color: '#2e7d32' },
  { label: 'Fail', value: 6, color: '#c62828' },
  { label: 'Blocked', value: 2, color: brand.amberDark },
  { label: 'Not run', value: 1, color: 'rgba(11,36,48,0.25)' },
];

function Donut({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: 76,
          height: 76,
          borderRadius: '50%',
          background: `conic-gradient(${color} 0% ${value}%, rgba(11,36,48,0.08) ${value}% 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            bgcolor: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: brand.tealDark }}>{value}%</Typography>
        </Box>
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textAlign: 'center' }}>
        {label}
      </Typography>
    </Box>
  );
}

export function DashboardPreviewSection() {
  return (
    <Box component="section" sx={{ position: 'relative', overflow: 'hidden', bgcolor: '#fff', py: { xs: 8, md: 12 } }}>
      <SectionBackground variant="light" seed={0} />
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1240, mx: 'auto', px: { xs: 3, sm: 5, md: 6 } }}>
        <Box sx={{ textAlign: 'center', maxWidth: 680, mx: 'auto', mb: 6 }}>
          <Typography
            variant="overline"
            sx={{ color: brand.teal, fontWeight: 700, letterSpacing: 1.2 }}
          >
            Preview
          </Typography>
          <Typography
            sx={{ color: brand.tealDark, fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.2rem' }, mt: 1, mb: 2 }}
          >
            See your test program at a glance
          </Typography>
          <Typography variant="body1" color="text.secondary">
            A look at the QA Manager dashboard we're building next — KPI tiles computed
            straight from your requirements, executions, and defects, with no manual rollups.
          </Typography>
        </Box>

        <Paper
          elevation={6}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(11,36,48,0.08)',
            maxWidth: 980,
            mx: 'auto',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 3,
              py: 1.5,
              bgcolor: 'rgba(11,36,48,0.03)',
              borderBottom: '1px solid rgba(11,36,48,0.08)',
            }}
          >
            {WINDOW_DOTS.map((color) => (
              <Box key={color} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
            ))}
            <Typography sx={{ ml: 1.5, fontWeight: 700, fontSize: '0.85rem', color: brand.tealDark }}>
              QA Manager Dashboard
            </Typography>
            <Chip
              label="Preview"
              size="small"
              icon={<InsightsOutlinedIcon sx={{ fontSize: 14 }} />}
              sx={{ ml: 'auto', height: 24, fontWeight: 700, bgcolor: `${brand.amber}20`, color: brand.amberDark }}
            />
          </Box>

          <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
                gap: { xs: 2.5, sm: 2 },
                mb: 4,
              }}
            >
              {KPI_DONUTS.map((kpi) => (
                <Box key={kpi.label} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Donut {...kpi} />
                </Box>
              ))}

              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.9rem', color: brand.tealDark, lineHeight: 1 }}>
                  14
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Open defects · 3 critical
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Chip
                  label="Conditional"
                  sx={{ fontWeight: 700, bgcolor: `${brand.amber}22`, color: brand.amberDark, mb: 0.75 }}
                />
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: 'text.secondary' }}>
                  Release readiness
                </Typography>
              </Box>
            </Box>

            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5 }}>
              EXECUTION RESULTS · CYCLE 12
            </Typography>
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                height: 10,
                borderRadius: 999,
                overflow: 'hidden',
                mt: 1,
                mb: 1.5,
              }}
            >
              {STATUS_BREAKDOWN.map((segment) => (
                <Box key={segment.label} sx={{ width: `${segment.value}%`, bgcolor: segment.color }} />
              ))}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
              {STATUS_BREAKDOWN.map((segment) => (
                <Box key={segment.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: segment.color }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    {segment.label} · {segment.value}%
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>

        <Typography
          variant="caption"
          align="center"
          sx={{ display: 'block', mt: 2.5, color: 'text.secondary' }}
        >
          Illustrative preview using sample data — dashboards &amp; the KPI engine ship in Milestone 9.
        </Typography>
      </Box>
    </Box>
  );
}
