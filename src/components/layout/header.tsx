import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Menu, X, Settings, LogOut, User } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, tenant, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user?.firstName || !user?.lastName) return 'U';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  // Get tenant name or default
  const getTenantName = () => {
    return tenant?.tenantName || 'Affiliate Platform';
  };

  // Get tenant initial or default
  const getTenantInitial = () => {
    return tenant?.tenantName?.charAt(0) || 'A';
  };

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 sticky top-0">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:mr-2">
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <Link to="/" className="flex items-center">
            {tenant?.logoUrl ? (
              <img 
                src={tenant.logoUrl} 
                alt={`${getTenantName()} Logo`} 
                className="h-8 w-auto mr-2" 
              />
            ) : (
              <div 
                className="h-8 w-8 rounded-md flex items-center justify-center text-primary-foreground font-bold"
                style={{ background: tenant?.primaryColor || '#3667CE' }}
              >
                {getTenantInitial()}
              </div>
            )}
            <span className="text-lg font-semibold hidden sm:block ml-2">
              {getTenantName()}
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.firstName} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="cursor-pointer flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;