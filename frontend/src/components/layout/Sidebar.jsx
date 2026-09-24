import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../common/Logo';
import { 
  LayoutDashboard, 
  PlusCircle, 
  CalendarCheck, 
  FileText, 
  Wrench, 
  Briefcase, 
  DollarSign, 
  Layers, 
  CheckSquare, 
  ShieldAlert, 
  Users, 
  Activity,
  UserCheck,
  Sparkles,
  Search,
  MessageSquare
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const renderNavLinks = () => {
    switch (user.role) {
      case 'Customer':
        return (
          <>
            <div className="sidebar-section-title">Home Command Center</div>
            <NavLink to="/dashboard/customer" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Dashboard Overview</span>
            </NavLink>
            <NavLink to="/dashboard/customer/create-request" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <PlusCircle size={18} />
              <span>Tell Us What You Need</span>
            </NavLink>
            <NavLink to="/dashboard/customer/requests" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <FileText size={18} />
              <span>My Requests & Quotes</span>
            </NavLink>
            <NavLink to="/dashboard/customer/bookings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <CalendarCheck size={18} />
              <span>Bookings & Tracking</span>
            </NavLink>
          </>
        );

      case 'Service Provider':
        return (
          <>
            <div className="sidebar-section-title">Provider Operations</div>
            <NavLink to="/dashboard/provider" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Provider Workspace</span>
            </NavLink>
            <NavLink to="/dashboard/provider/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <UserCheck size={18} />
              <span>Verified Pro Profile</span>
            </NavLink>
            <NavLink to="/dashboard/provider/opportunities" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Briefcase size={18} />
              <span>Job Opportunities</span>
            </NavLink>
            <NavLink to="/dashboard/provider/quotes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <DollarSign size={18} />
              <span>Submitted Quotes</span>
            </NavLink>
          </>
        );

      case 'Operations Manager':
        return (
          <>
            <div className="sidebar-section-title">Operations Tower</div>
            <NavLink to="/dashboard/ops" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Ops Overview</span>
            </NavLink>
            <NavLink to="/dashboard/ops/verifications" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <CheckSquare size={18} />
              <span>Provider Verification Queue</span>
            </NavLink>
            <NavLink to="/dashboard/ops/categories" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Layers size={18} />
              <span>Service Categories & Pricing</span>
            </NavLink>
          </>
        );

      case 'Platform Admin':
        return (
          <>
            <div className="sidebar-section-title">Platform Governance</div>
            <NavLink to="/dashboard/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />
              <span>Admin Console</span>
            </NavLink>
            <NavLink to="/dashboard/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>User Role Management</span>
            </NavLink>
            <NavLink to="/dashboard/admin/audit-logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Activity size={18} />
              <span>Audit & Security Logs</span>
            </NavLink>
          </>
        );

      case 'Support Agent':
        return (
          <>
            <div className="sidebar-section-title">Support Command</div>
            <NavLink to="/dashboard/support" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <MessageSquare size={18} />
              <span>Ticket Command Center</span>
            </NavLink>
            <NavLink to="/dashboard/support/disputes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <ShieldAlert size={18} />
              <span>Active Dispute Queue</span>
            </NavLink>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--color-primary-deep)',
        color: '#ffffff',
        padding: '1.75rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        flexShrink: 0,
        boxShadow: '4px 0 24px rgba(23, 63, 58, 0.15)'
      }}
    >
      <div style={{ padding: '0 0.5rem 1.25rem 0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '0.75rem' }}>
        <Logo size="sm" variant="inverse" />
      </div>

      <style>{`
        .sidebar-section-title {
          padding: 0.5rem 0.75rem;
          font-size: 0.6875rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 0.5rem;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0.875rem;
          color: rgba(255, 255, 255, 0.75);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.90625rem;
          border-radius: var(--radius-md);
          transition: all 0.2s ease;
        }
        .sidebar-link:hover {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.08);
        }
        .sidebar-link.active {
          color: #ffffff;
          background-color: var(--color-accent);
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(217, 139, 95, 0.3);
        }
      `}</style>

      {renderNavLinks()}
    </aside>
  );
};

export default Sidebar;
