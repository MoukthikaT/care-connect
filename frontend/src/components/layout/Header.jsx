import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../common/Logo';

const dashboardFor = role => ({ Customer:'/dashboard/customer', 'Service Provider':'/dashboard/provider', 'Operations Manager':'/dashboard/ops', 'Platform Admin':'/dashboard/admin', 'Support Agent':'/dashboard/support' }[role] || '/');

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const signOut = () => { logout(); close(); navigate('/login'); };
  return <header className={`site-header ${location.pathname === '/' ? 'header-home' : ''}`}>
    <div className="header-inner"><Logo size="md"/>
      <button className="mobile-menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
      <nav className={`header-nav ${open?'nav-open':''}`} aria-label="Main navigation">
        <NavLink to="/services" onClick={close} className={({isActive})=>isActive?'nav-active':''}>Services</NavLink>
        <Link to="/#how-it-works" onClick={close}>How it works</Link>
        {!isAuthenticated && <Link to="/register" onClick={close}>For professionals</Link>}
        {isAuthenticated ? <><Link className="header-dashboard" to={dashboardFor(user?.role)} onClick={close}><LayoutDashboard size={16}/> My workspace</Link><span className="header-user"><span className="user-avatar">{user?.name?.charAt(0)?.toUpperCase()}</span><span>{user?.name}<small>{user?.role}</small></span></span><button className="header-logout" onClick={signOut} title="Sign out" aria-label="Sign out"><LogOut size={17}/></button></> : <><Link className="header-signin" to="/login" onClick={close}>Sign in</Link><Link className="header-join" to="/register" onClick={close}>Get started <ArrowUpRight size={15}/></Link></>}
      </nav>
    </div>
  </header>;
}
