# QMICS TestSphere — Build Workflow & Roadmap

This document is the build plan for TestSphere, derived from `TestSphere Requirements.pdf`.
It defines the architecture, the order in which modules get built, and the exit criteria for
each milestone. Nothing here is implemented yet — this is the plan we execute against.

## Guiding principles

1. **Traceability chain drives build order.** The spec's core value loop is
   `Requirement → Test Scenario → Test Case → Test Execution → Defect → Retest → Release`.
   We build the entities in that order because each one depends on the last existing first.
2. **Walking skeleton before breadth.** Get one thin end-to-end slice (auth → one project →
   one requirement → one test case → one execution → one defect) working before fanning out
   to every field and every module.
3. **AI and integrations are additive layers, not a phase-1 dependency.** They sit on top of a
   stable data model (Section 21–24, 27 of the spec) and get built once the core STLC works.
4. **Compliance/audit is not bolted on at the end.** Audit trail + soft-delete + versioning are
   built into the data layer from Milestone 1, because retrofitting them is expensive.

## Tech stack

- **Monorepo:** npm workspaces (or Turborepo once the workspace count grows)
- **Backend:** Node.js + TypeScript, **NestJS** (module system maps directly onto the spec's
  functional modules; built-in DI, guards for RBAC, and interceptors for audit logging)
- **Database:** PostgreSQL + **Prisma ORM** (strong migration story, good fit for the heavy
  relational structure: org → BU → project → release → test cycle)
- **Frontend:** React + Vite, **TanStack Query** for server state, **TanStack Table** for the
  grid-heavy screens (test cases, defects, execution logs)
- **Auth:** JWT access/refresh tokens now; OIDC/SSO (Section 2, 28) added as a pluggable
  strategy later without changing the core auth flow
- **Testing:** Vitest (unit), Supertest (API integration), Playwright (E2E)
- **CI/CD:** GitHub Actions — lint, typecheck, test, build on every PR

### Proposed repo layout

```
TestSphere/
  apps/
    api/            NestJS backend
    web/             React frontend
  packages/
    shared-types/    DTOs/enums shared between api and web
    ui/              shared React components (later)
  WORKFLOW.md
```

## Milestones

### M0 — Foundation
- Monorepo scaffold, lint/format/typecheck pipeline, CI pipeline
- Prisma schema project scaffold, local Postgres via Docker Compose
- Base NestJS app: health check, global exception filter, request logger
- **Exit criteria:** `npm run dev` boots API + web; CI green on empty repo

### M1 — Organization & User Management (spec §2)
- Entities: Organization, BusinessUnit, User, Role, Permission, TeamMembership
- Auth: signup/login, JWT, password hashing, refresh tokens
- RBAC guard + permission matrix (roles from §2: Admin, QA Manager, Test Manager, Test Lead,
  Tester, Developer, BA, Product Owner, Auditor, Management)
- Cross-cutting: **AuditLog** table + interceptor (every write records who/when/what) — built
  now because every later module depends on it existing
- **Exit criteria:** an admin can create an org, invite users, assign roles; RBAC blocks
  unauthorized actions; every mutation appears in the audit log

### M2 — Project & Product Management (spec §3)
- Entities: Project, Product, Version, Release, Sprint, Build, Environment, Module/Component
- Project workspace shell in the frontend (the container everything else lives inside)
- **Exit criteria:** a user can create a project, a release, and a build inside an org

### M3 — Requirements Management (spec §4)
- Entity: Requirement (with type, priority, risk, version, status, attachments, change history)
- Requirement CRUD + versioning + approval workflow (simple state machine first)
- **Exit criteria:** requirements can be created, versioned, and linked to a project/release

### M4 — Test Scenario & Test Case Management (spec §6–7)
- Entities: TestScenario (mapped to Requirement), TestCase (mapped to TestScenario)
- Full Test Case structure from §7: steps, expected result, test data ref, priority, risk, tags
- Test case features: clone, template, bulk import/export, versioning, review workflow
- **Exit criteria:** a requirement can be decomposed into scenarios and cases end-to-end in the UI

### M5 — Test Planning, Test Data, Environments (spec §5, 8, 9)
- Entities: TestPlan (scope/strategy/entry-exit criteria/schedule/approval), TestData,
  Environment (with booking/status/issue tracking)
- **Exit criteria:** a Test Manager can assemble a test plan referencing real test cases, data,
  and a booked environment

### M6 — Test Execution Management (spec §10)
- Entities: TestCycle, TestSuite, TestExecution (Pass/Fail/Blocked/Not Run/Retest, evidence)
- Execution UI: assign to tester, run test case, upload evidence, log result
- **Exit criteria:** the walking skeleton closes: Requirement → Scenario → Case → Execution works

### M7 — Defect Management + Analytics (spec §11–12)
- Entity: Defect with full lifecycle state machine (New→Assigned→...→Closed, plus
  Rejected/Duplicate/Deferred/Reopened/Cannot Reproduce)
- Link defects to test executions and requirements (closes the traceability loop)
- Defect analytics queries: by module/release/tester/developer, ageing, leakage, density
- **Exit criteria:** a failed execution can raise a defect, route through its lifecycle, and
  surface in analytics

### M8 — Traceability Matrix & Release Quality Score (spec §18–19)
- Read-model that joins Requirement↔Scenario↔Case↔Execution↔Defect
- Release Quality Score calculation (coverage %, pass %, critical defects, etc.) with
  Ready/Conditional/Not-Ready output
- **Exit criteria:** given a release, the system renders the traceability matrix and a quality
  score without manual computation

### M9 — Dashboards & KPIs (spec §20, 31)
- QA Manager dashboard, Executive dashboard
- KPI engine: the ~18 metrics in §31, computed from existing tables (no new core entities)
- **Exit criteria:** dashboards are live and reflect real data from M1–M8

### M10 — Workflow/Approval Engine + Notifications (spec §23–24)
- Generalize the ad-hoc approval flows from M3/M4/M5 into a configurable workflow engine
- Email/in-app notifications; Teams/Slack later
- **Exit criteria:** approval steps for requirements/test plans/test cases/defects/releases are
  configurable, not hardcoded

### M11 — Automation, API, Performance, Security, UAT modules (spec §13–17)
- Automation job ingestion (Selenium/Playwright/Cypress/Appium results via webhook/API)
- API test repository + execution results
- Performance/security test tracking (results ingestion, not building a load-test engine)
- UAT module (business user allocation, sign-off, certificate)
- **Exit criteria:** each module can ingest results and they show up in traceability + quality
  score alongside manual test results

### M12 — Integrations (spec §27)
- GitHub/GitLab/Bitbucket/Azure DevOps/Jira connectors
- CI/CD webhooks (Jenkins/GitHub Actions/GitLab CI/Azure Pipelines)
- **Exit criteria:** a code change or pipeline run can automatically link to a defect/build

### M13 — AI Features (spec §21–22)
Built last because they consume the data model from M1–M9 (a requirement, a defect, or a
code diff needs to already exist for AI to act on it):
- AI Test Case Generator (requirement/user story → scenarios/cases)
- AI Test Coverage Analyzer, AI Defect Intelligence, AI Regression Optimization,
  AI Release Risk Prediction
- **Exit criteria:** each AI feature is an opt-in enhancement on an existing screen, never a
  hard dependency for core STLC usage

### M14 — Compliance & Non-Functional Hardening (spec §26, 28)
- Formalize e-signatures where required, data retention policies, PII/PHI handling for test
  data (§8), encryption at rest/in transit, SSO/MFA
- Load testing the platform itself, HA/DR setup
- **Exit criteria:** compliance checklist from §26 mapped to concrete controls, each verifiable

## Immediate next step

Once you confirm this plan, M0 starts: scaffold the monorepo (NestJS API + React web +
Prisma + Docker Compose + CI), commit it, then move to M1 (Org & User Management with RBAC
and audit logging).

## Note on version control

Git is not currently installed on this machine, so this folder isn't a repo yet. Install Git
for Windows (https://git-scm.com/download/win), then run `git init` here and we'll commit
this plan as the first commit before scaffolding M0.
