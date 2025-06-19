import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { Toaster } from '@/components/ui/sonner';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Home, LogOut, Target, Settings, User, Bell, HelpCircle, Search, BarChart3, MessageCircle, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

  // Sidebar navigation items
  const navItems = [
    { 
      icon: <Home className="h-5 w-5" />, 
      href: "/influencer/dashboard", 
      label: "Home" 
    },
    { 
      icon: <BarChart3 className="h-5 w-5" />, 
      href: "/influencer/campaigns", 
      label: "Stats" 
    },
    { 
      icon: <MessageCircle className="h-5 w-5" />, 
      href: "/influencer/settings/notifications", 
      label: "Messages" 
    },
    { 
      icon: <BookOpen className="h-5 w-5" />, 
      href: "/influencer/support-hub", 
      label: "Resources" 
    },
    { 
      icon: <Settings className="h-5 w-5" />, 
      href: "/influencer/settings/profile", 
      label: "Settings" 
    },
  ];

  // Sidebar content
  const sidebar = (
    <aside className={cn(
      'z-20 flex flex-col bg-gradient-to-b from-teal-500 to-teal-400 transition-transform duration-300 ease-in-out',
      isMobileView ? 'fixed inset-y-0 left-0 w-24 max-w-full transform translate-x-0 md:relative md:translate-x-0' : 'relative w-24',
    )} aria-label="Sidebar">
      <div className="px-4 pt-8 pb-6 flex flex-col items-center">
        <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
          <AvatarImage src={user?.avatarUrl || ""} alt={user?.firstName || "User"} />
          <AvatarFallback className="bg-yellow-300 text-yellow-800 text-xl">
            {user?.firstName?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex-1 py-6 flex flex-col items-center gap-8">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all",
              location.pathname === item.href || 
              (item.href.includes('/settings') && location.pathname.includes('/settings'))
                ? "bg-white text-teal-600 shadow-md"
                : "text-white hover:bg-teal-400 hover:text-white"
            )}
          >
            {item.icon}
          </Link>
        ))}
      </div>
      <div className="px-4 py-8 flex flex-col items-center">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-12 h-12 rounded-full text-white hover:bg-teal-400 transition-all"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f0f4fa] flex">
      {/* Sidebar */}
      {sidebar}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white shadow-sm px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 w-full max-w-md">
            <Search className="h-5 w-5 text-gray-400" />
            <Input 
              type="search" 
              placeholder="Search..." 
              className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-sm">
              Account Settings
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4">
                <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor"></path>
              </svg>
            </Button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default InfluencerShell; 