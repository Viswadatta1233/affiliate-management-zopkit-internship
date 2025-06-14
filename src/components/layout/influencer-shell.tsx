import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { Toaster } from '@/components/ui/sonner';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Home, LogOut, Target, Settings, User, Shield, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SidebarItem } from './SidebarItem';
import { Button } from '@/components/ui/button';

const InfluencerShell: React.FC = () => {
  const { isAuthenticated, isLoading, loadUserData, user, logout } = useAuthStore();
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const location = useLocation();
  const navigate = useNavigate();

  // Check for mobile view
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Load user data
  useEffect(() => {
    if (isAuthenticated && !user) {
      loadUserData();
    }
  }, [isAuthenticated, user, loadUserData]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Loading skeleton
  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="border-b bg-card">
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex-1 p-4 md:p-8 space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-4 w-[400px]" />
          </div>
        </div>
      </div>
    );
  }

  // Sidebar content
  const sidebar = (
    <aside className={cn(
      'z-20 flex flex-col border-r bg-white pt-2 shadow-sm transition-transform duration-300 ease-in-out',
      isMobileView ? 'fixed inset-y-0 left-0 w-64 max-w-full transform translate-x-0 md:relative md:translate-x-0' : 'relative w-64',
    )} aria-label="Sidebar">
      <div className="px-4 pt-2 pb-4 flex flex-col items-center">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-400 text-white text-2xl font-bold shadow-md border-2 border-white">
          I
        </span>
        <div className="rounded-xl bg-gradient-to-tr from-blue-50 to-indigo-100 text-blue-900 font-extrabold text-xl text-center tracking-wide shadow border border-blue-200 px-4 py-2 w-full mt-2">
          Influencer
        </div>
      </div>
      <ScrollArea className="flex-1 py-2 px-4">
        <SidebarItem
          href="/influencer/dashboard"
          icon={<Home className="h-4 w-4" />}
          title="Dashboard"
          isCurrent={location.pathname === '/influencer/dashboard'}
        />
        <SidebarItem
          href="/influencer/campaigns"
          icon={<Target className="h-4 w-4" />}
          title="Campaigns"
          isCurrent={location.pathname === '/influencer/campaigns'}
        />
        <SidebarItem
          href="/influencer/settings/notifications"
          icon={<Bell className="h-4 w-4" />}
          title="Notifications"
          isCurrent={location.pathname === '/influencer/settings/notifications'}
        />
        <div className="mt-4">
          <SidebarItem
            href="/influencer/settings/profile"
            icon={<Settings className="h-4 w-4" />}
            title="Settings"
            isCurrent={location.pathname.startsWith('/influencer/settings') && !location.pathname.endsWith('/notifications')}
          />
        </div>
      </ScrollArea>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b bg-card z-40">
        <div className="h-full px-4 flex items-center justify-between">
          <Link 
            to="/influencer/dashboard"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <Home className="h-5 w-5" />
            <span>Influencer Dashboard</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.firstName} {user?.lastName}
            </span>
            <ModeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main layout with sidebar */}
      <div className="flex flex-1 overflow-hidden pt-16 relative">
        {!isMobileView && sidebar}
        <main className={cn('flex-1 relative transition-all duration-300 ease-in-out')}> 
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="w-full px-4 py-4 sm:px-6 md:px-8 md:py-6">
              <Outlet />
            </div>
          </ScrollArea>
        </main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default InfluencerShell; 