import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { Toaster } from '@/components/ui/sonner';
import { ModeToggle } from '@/components/theme/mode-toggle';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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

  // Loading skeleton with improved visual hierarchy
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b bg-card">
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex flex-1">
          <Skeleton className="w-64 h-full hidden md:block" />
          <div className="flex-1 p-4 md:p-8 space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-[250px]" />
              <Skeleton className="h-4 w-[400px]" />
            </div>
            <div className="grid gap-4">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-[120px] rounded-lg" />
                <Skeleton className="h-[120px] rounded-lg" />
                <Skeleton className="h-[120px] rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1 overflow-hidden pt-16">
        <Sidebar isOpen={isSidebarOpen} isMobile={isMobileView} onClose={() => setIsSidebarOpen(false)} />
        <main 
          className={cn(
            "flex-1 relative transition-all duration-300 ease-in-out",
            isSidebarOpen && !isMobileView ? 'md:ml-64' : ''
          )}
        >
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="px-4 md:px-6 lg:px-8 py-6">
              <div className="mx-auto max-w-7xl">
                <Outlet />
              </div>
            </div>
          </ScrollArea>
        </main>
      </div>
      <div className="fixed bottom-6 right-6 z-50">
        <ModeToggle />
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default AppShell;