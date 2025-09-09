import React, { useState } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
};

return (
    <div className="min-h-screen bg-gray-50">
    <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
    
    {/* Main content area */}
    <div 
        className={`transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        sidebarCollapsed ? 'ml-20' : 'ml-72'
        }`}
    >
        <main className="p-6">
        {children}
        </main>
    </div>
    </div>
  );
}
