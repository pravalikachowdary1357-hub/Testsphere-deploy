import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import CorporateFareOutlinedIcon from '@mui/icons-material/CorporateFareOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import type SvgIcon from '@mui/material/SvgIcon';

export interface AdminNavItem {
  label: string;
  to: string;
  Icon: typeof SvgIcon;
  /** Undefined = visible to any authenticated user (no backing permission yet). */
  permission?: string;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Dashboard', to: '/dashboard', Icon: DashboardOutlinedIcon },
  { label: 'Organization Management', to: '/admin/organizations', Icon: CorporateFareOutlinedIcon, permission: 'organization:read' },
  { label: 'User Management', to: '/admin/users', Icon: GroupOutlinedIcon, permission: 'user:read' },
  { label: 'Role Management', to: '/admin/roles', Icon: AdminPanelSettingsOutlinedIcon, permission: 'role:read' },
  { label: 'Permission Management', to: '/admin/permissions', Icon: VpnKeyOutlinedIcon, permission: 'permission:read' },
  { label: 'Project Management', to: '/admin/projects', Icon: WorkOutlineOutlinedIcon, permission: 'project:read' },
  { label: 'Product Management', to: '/admin/products', Icon: Inventory2OutlinedIcon, permission: 'product:read' },
  { label: 'Requirement Management', to: '/admin/requirements', Icon: DescriptionOutlinedIcon, permission: 'requirement:read' },
  { label: 'Test Plan Management', to: '/admin/test-plans', Icon: EventNoteOutlinedIcon, permission: 'testplan:read' },
  { label: 'Test Case Management', to: '/admin/test-cases', Icon: ChecklistOutlinedIcon, permission: 'testcase:read' },
  { label: 'Test Suite Management', to: '/admin/test-suites', Icon: LayersOutlinedIcon, permission: 'testsuite:read' },
  { label: 'Test Execution', to: '/admin/test-execution', Icon: PlayCircleOutlineOutlinedIcon, permission: 'testexecution:read' },
  { label: 'Defect Management', to: '/admin/defects', Icon: BugReportOutlinedIcon, permission: 'defect:read' },
  { label: 'Reports & Analytics', to: '/admin/reports', Icon: AssessmentOutlinedIcon, permission: 'report:read' },
  { label: 'Audit Logs', to: '/admin/audit-logs', Icon: FactCheckOutlinedIcon, permission: 'audit:read' },
  { label: 'Settings', to: '/admin/settings', Icon: SettingsOutlinedIcon, permission: 'organization:read' },
  { label: 'Profile', to: '/profile', Icon: PersonOutlineOutlinedIcon },
];
