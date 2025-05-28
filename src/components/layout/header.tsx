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
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  Menu,
  X,
  Settings,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
    <header className="fixed top-0 left-0 right-0 z-30 h-16 border-b bg-background">
      <nav className="h-full px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="shrink-0 hover:bg-accent"
          >
            {isSidebarOpen ? (
              <X className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {tenant?.logoUrl ? (
              <img 
                src={tenant.logoUrl} 
                alt={`${getTenantName()} Logo`} 
                className="h-8 w-auto" 
              />
            ) : (
              <div 
                className="h-8 w-8 rounded-md flex items-center justify-center text-primary-foreground font-medium shadow-sm"
                style={{ background: tenant?.primaryColor || 'hsl(var(--primary))' }}
              >
                {getTenantInitial()}
              </div>
            )}
            <span className="text-lg font-semibold hidden sm:block">
              {getTenantName()}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-accent"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            <Badge 
              variant="destructive" 
              className="absolute top-1.5 right-1.5 h-2 w-2 p-0"
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="gap-2 pl-2 pr-3 hover:bg-accent"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src="" alt={user?.firstName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium leading-none truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings/profile" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings/general" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                <span>Log out</span>
                <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
};

export default Header;