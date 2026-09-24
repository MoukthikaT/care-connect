import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../hooks/useAuth';

export const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-container">
      <Header />
      <div className="main-content-layout">
        {isAuthenticated && <Sidebar />}
        <main className="page-container animate-fade-in">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
