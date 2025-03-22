import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './AdminLayout.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Check if screen is mobile size and collapse sidebar by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarCollapsed(true);
      }
    };
    
    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="admin-layout">
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>
      <Sidebar 
        onToggleCollapse={handleSidebarToggle} 
        isMobileOpen={isMobileMenuOpen} 
      />
      <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}>
        <Topbar onMobileMenuToggle={toggleMobileMenu} />
        <div className="content-wrapper">
          <div className="page-header">
            <h1 className="page-title"></h1>
            <div className="breadcrumb">
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;