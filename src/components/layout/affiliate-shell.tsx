import React from 'react';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import {
  Home,
  BarChart3,
  DollarSign,
  Link2,
  CreditCard,
  User,
  LogOut
} from 'lucide-react';

const sidebarNavItems = [
  {
    section: "Dashboard",
    items: [
      {
        title: "Overview",
        href: "/affiliate/dashboard",
        icon: Home,
        description: "Your affiliate summary"
      }
    ]
  },
  
  {
    section: "Finance",
    items: [
      {
        title: "Earnings",
        href: "/affiliate/earnings",
        icon: DollarSign,
        description: "Your commission earnings"
      },
      {
        title: "Payouts",
        href: "/affiliate/payouts",
        icon: CreditCard,
        description: "Payment history and requests"
      }
    ]
  },
  {
    section: "Account",
    items: [
      {
        title: "Profile",
        href: "/affiliate/profile",
        icon: User,
        description: "Manage your profile"
      }
    ]
  }
];

export default function AffiliateShell() {
  const location = useLocation();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col gap-4 border-r bg-white dark:bg-gray-900 h-full">
          <div className="flex items-center gap-2 px-6 py-6 border-b">
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Affiliate Portal</h2>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto px-4 py-2">
            <nav className="flex flex-col gap-6 flex-1">
              {sidebarNavItems.map((section) => (
                <div key={section.section} className="space-y-3">
                  <div className="px-2 py-1">
                    <h3 className="text-xs uppercase font-semibold tracking-wider text-gray-500 dark:text-gray-400">{section.section}</h3>
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <RouterLink
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-800 group relative",
                            location.pathname === item.href 
                              ? "bg-primary/10 text-primary font-medium" 
                              : "text-gray-700 dark:text-gray-300"
                          )}
                        >
                          <div className={cn(
                            "p-1 rounded-md",
                            location.pathname === item.href 
                              ? "bg-primary/20 text-primary" 
                              : "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300"
                          )}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span>{item.title}</span>
                        </RouterLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>
          
          {/* Logout Button */}
          <div className="px-4 py-4 mt-auto border-t">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              onClick={handleLogout}
            >
              <div className="p-1 rounded-md text-gray-500">
                <LogOut className="h-4 w-4" />
              </div>
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72 flex flex-col flex-1">
        <main className="flex-1 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
} 