import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { Toaster } from '@/components/ui/toaster';
import { ModeToggle } from '@/components/theme/mode-toggle';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';

const AppShell: React.FC = () => {
  const { isAuthenticated, isLoading, loadUserData } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Check for mobile view and adjust sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Load user data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated, loadUserData]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b">
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex flex-1">
          <Skeleton className="w-64 h-full hidden md:block" />
          <div className="flex-1 p-4 md:p-8">
            <Skeleton className="h-12 w-1/3 mb-6" />
            <Skeleton className="h-64 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} isMobile={isMobileView} onClose={() => setIsSidebarOpen(false)} />
        <main 
          className={`
            flex-1 
            overflow-auto 
            transition-all 
            duration-200 
            p-4 
            md:p-6 
            lg:p-8
            ${isSidebarOpen && !isMobileView ? 'md:ml-64' : ''}
          `}
        >
          <div className="container mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      <div className="fixed bottom-4 right-4 z-50">
        <ModeToggle />
      </div>
      <Toaster />
    </div>
  );
};

export default AppShell;