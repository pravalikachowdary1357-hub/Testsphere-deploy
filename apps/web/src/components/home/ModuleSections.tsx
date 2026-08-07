import type { ReactNode } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import CheckIcon from '@mui/icons-material/Check';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import { brand } from '../../theme/theme';
import { FeatureModuleSection } from './FeatureModuleSection';

function VisualCard({ children }: { children: ReactNode }) {
  return (
    <Paper
      elevation={6}
      sx={{ width: '100%', p: 3, borderRadius: 4, border: '1px solid rgba(11,36,48,0.08)' }}
    >
      {children}
    </Paper>
  );
}

function TestPlanningVisual() {
  const rows = ['Scope & strategy defined', 'Entry criteria agreed', 'Exit criteria agreed'];
  return (
    <VisualCard>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{ fontWeight: 700, color: brand.tealDark }}>Release 4.2 — Test Plan</Typography>
        <Chip label="Pending approval" size="small" sx={{ fontWeight: 700, bgcolor: `${brand.amber}22`, color: brand.amberDark }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2 }}>
        {rows.map((row) => (
          <Box key={row} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                bgcolor: brand.teal,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CheckIcon sx={{ fontSize: 13 }} />
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(11,36,48,0.8)' }}>
              {row}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
        <ScheduleOutlinedIcon sx={{ fontSize: 17 }} />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          Aug 18 – Sep 02
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
        <DnsOutlinedIcon sx={{ fontSize: 17 }} />
        <Typography variant="caption" sx={{ fontWeight: 600 }}>
          Environment: Staging-2 · Booked
        </Typography>
      </Box>
    </VisualCard>
  );
}

function TestCaseVisual() {
  const steps = ['Request a reset link for a valid account', 'Wait 61 minutes', 'Attempt to use the reset link'];
  return (
    <VisualCard>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography sx={{ fontWeight: 700, color: brand.tealDark, fontSize: '0.85rem' }}>TC-014</Typography>
        <Chip label="High" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: '#fde8e8', color: '#c62828' }} />
        <Chip label="Med risk" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: `${brand.amber}22`, color: brand.amberDark }} />
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(11,36,48,0.85)', mb: 1.5 }}>
        Verify password reset token expires after 1 hour
      </Typography>
      <Box component="ol" sx={{ m: 0, mb: 2, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {steps.map((step) => (
          <Typography component="li" key={step} variant="caption" sx={{ color: 'text.secondary' }}>
            {step}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {['auth', 'regression'].map((tag) => (
            <Chip key={tag} label={tag} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(11,36,48,0.06)' }} />
          ))}
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 700, color: brand.teal }}>
          v3 · 2 approvals
        </Typography>
      </Box>
    </VisualCard>
  );
}

function TestExecutionVisual() {
  const stats = [
    { label: 'Pass', value: 91, color: '#2e7d32' },
    { label: 'Fail', value: 6, color: '#c62828' },
    { label: 'Blocked', value: 2, color: brand.amberDark },
    { label: 'Not run', value: 1, color: 'rgba(11,36,48,0.4)' },
  ];
  return (
    <VisualCard>
      <Typography sx={{ fontWeight: 700, color: brand.tealDark, mb: 2 }}>Cycle 12 · Sprint 24</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.25, mb: 2.5 }}>
        {stats.map((stat) => (
          <Box
            key={stat.label}
            sx={{ textAlign: 'center', py: 1, borderRadius: 2, bgcolor: 'rgba(11,36,48,0.03)' }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: stat.color }}>{stat.value}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          borderRadius: 2,
          bgcolor: `${brand.teal}0f`,
          border: `1px solid ${brand.teal}22`,
        }}
      >
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            bgcolor: '#2e7d32',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CheckIcon sx={{ fontSize: 16 }} />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: brand.tealDark, lineHeight: 1.3 }}>
            TC-014 · Password reset token expiry
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tester: J. Alvarez · Pass
          </Typography>
        </Box>
      </Box>
    </VisualCard>
  );
}

function DefectVisual() {
  const stages = ['New', 'Assigned', 'In Progress', 'Retest', 'Closed'];
  const activeIndex = 2;
  return (
    <VisualCard>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5, mb: 1.5, display: 'block' }}>
        DEFECT LIFECYCLE
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
        {stages.map((stage, index) => (
          <Chip
            key={stage}
            label={stage}
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: index === activeIndex ? brand.teal : 'rgba(11,36,48,0.06)',
              color: index === activeIndex ? '#fff' : 'rgba(11,36,48,0.6)',
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(11,36,48,0.03)' }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            bgcolor: '#c62828',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '0.7rem',
            fontWeight: 800,
          }}
        >
          !
        </Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: brand.tealDark, lineHeight: 1.3 }}>
            DEF-231 · Login fails on SSO redirect
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Critical · linked to TC-014 &amp; REQ-08
          </Typography>
        </Box>
      </Box>
    </VisualCard>
  );
}

function ReportsVisual() {
  const score = 82;
  const metrics = [
    { label: 'Coverage', value: '78%' },
    { label: 'Pass rate', value: '91%' },
    { label: 'Critical defects', value: '2' },
  ];
  return (
    <VisualCard>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2.5 }}>
        <Box
          sx={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: `conic-gradient(${brand.teal} 0% ${score}%, rgba(11,36,48,0.08) ${score}% 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Box
            sx={{
              width: 62,
              height: 62,
              borderRadius: '50%',
              bgcolor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: brand.tealDark }}>{score}</Typography>
          </Box>
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, color: brand.tealDark, mb: 0.5 }}>Release Quality Score</Typography>
          <Chip label="Conditional" size="small" sx={{ fontWeight: 700, bgcolor: `${brand.amber}22`, color: brand.amberDark }} />
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
        {metrics.map((metric) => (
          <Box key={metric.label} sx={{ textAlign: 'center', py: 1, borderRadius: 2, bgcolor: 'rgba(11,36,48,0.03)' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: brand.tealDark }}>{metric.value}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {metric.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </VisualCard>
  );
}

function WorkflowVisual() {
  const steps = [
    { label: 'Requirement', reviewer: 'B. Chen', state: 'approved' as const },
    { label: 'Test Plan', reviewer: 'T. Osei', state: 'approved' as const },
    { label: 'Release', reviewer: 'QA Manager', state: 'pending' as const },
  ];
  return (
    <VisualCard>
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.5, mb: 2, display: 'block' }}>
        APPROVAL CHAIN
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {steps.map((step) => (
          <Box key={step.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                bgcolor: step.state === 'approved' ? '#2e7d32' : `${brand.amber}22`,
                color: step.state === 'approved' ? '#fff' : brand.amberDark,
              }}
            >
              {step.state === 'approved' ? <CheckIcon sx={{ fontSize: 16 }} /> : <ScheduleOutlinedIcon sx={{ fontSize: 16 }} />}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: brand.tealDark, lineHeight: 1.2 }}>
                {step.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {step.state === 'approved' ? `Approved · ${step.reviewer}` : `Awaiting · ${step.reviewer}`}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </VisualCard>
  );
}

const MODULES = [
  {
    id: 'modules',
    Icon: EventNoteOutlinedIcon,
    eyebrow: 'Test Planning',
    title: 'Plan every cycle with intent',
    description:
      "Test plans capture scope, strategy, and entry/exit criteria up front — with a real approval step before execution starts, not a spreadsheet nobody reopens.",
    bullets: [
      'Scope, strategy, and schedule in one reviewable document',
      'Entry & exit criteria enforced before a cycle can close',
      'Test data sets and environment bookings attached to the plan',
      'Approval workflow — no plan proceeds unsigned',
    ],
    visual: <TestPlanningVisual />,
  },
  {
    id: 'test-cases',
    Icon: ChecklistOutlinedIcon,
    eyebrow: 'Test Case Management',
    title: 'Test cases built to be reused, not rewritten',
    description: "Every case carries the structure a real STLC needs — and the history to prove it's been reviewed.",
    bullets: [
      'Structured steps, expected results, and test data references',
      'Priority, risk, and tags for fast filtering at scale',
      'Clone, template, and bulk import/export for large suites',
      'Full version history with a review workflow before go-live',
    ],
    visual: <TestCaseVisual />,
  },
  {
    id: 'test-execution',
    Icon: PlayCircleOutlineOutlinedIcon,
    eyebrow: 'Test Execution',
    title: 'Run cycles, capture evidence, know status instantly',
    description:
      'Executions are the moment truth enters the system — every result is logged, evidenced, and linked back to the case that produced it.',
    bullets: [
      'Organize runs into test cycles and suites, assigned by tester',
      'Log Pass, Fail, Blocked, Not Run, or Retest with attached evidence',
      "Every result feeds traceability the instant it's saved",
    ],
    visual: <TestExecutionVisual />,
  },
  {
    id: 'defects',
    Icon: BugReportOutlinedIcon,
    eyebrow: 'Defect Management',
    title: 'From failed step to fixed build, fully tracked',
    description:
      "A failed execution doesn't just sit in a spreadsheet — it becomes a defect with a real lifecycle and a straight line back to what it broke.",
    bullets: [
      'Full lifecycle: New → Assigned → In Progress → Retest → Closed',
      'Plus Rejected, Duplicate, Deferred, Reopened, Cannot Reproduce',
      'Linked directly to the execution and requirement that raised it',
      'Built-in analytics: ageing, leakage, and density by module or release',
    ],
    visual: <DefectVisual />,
  },
  {
    id: 'reports',
    Icon: AssessmentOutlinedIcon,
    eyebrow: 'Reports & Analytics',
    title: "A release quality score you don't calculate by hand",
    description:
      'The traceability matrix joins requirement, scenario, case, execution, and defect automatically — and rolls it up into one go / no-go signal.',
    bullets: [
      'Traceability matrix generated from live data, not a manual join',
      'Release Quality Score: coverage %, pass %, and open critical defects',
      'Ready / Conditional / Not-Ready — a call, not just a chart',
      'QA Manager and Executive dashboards, no spreadsheet rollups',
    ],
    visual: <ReportsVisual />,
  },
  {
    id: 'workflow',
    Icon: RuleOutlinedIcon,
    eyebrow: 'Workflow & Approvals',
    title: 'Sign-off that fits how your team actually works',
    description:
      "Approval steps for requirements, test plans, test cases, and defects are configurable — not hardcoded into a process that doesn't match yours.",
    bullets: [
      'Configurable approval chains per artifact type',
      "In-app and email notifications when it's your turn to sign off",
      'Every approval is itself an audited, timestamped event',
    ],
    visual: <WorkflowVisual />,
  },
];

export function ModuleSections() {
  return (
    <>
      {MODULES.map((module, index) => (
        <FeatureModuleSection
          key={module.id}
          id={module.id}
          Icon={module.Icon}
          eyebrow={module.eyebrow}
          title={module.title}
          description={module.description}
          bullets={module.bullets}
          visual={module.visual}
          reverse={index % 2 === 1}
          background={index % 2 === 1 ? brand.skyLight : '#fff'}
          seed={index + 2}
        />
      ))}
    </>
  );
}
