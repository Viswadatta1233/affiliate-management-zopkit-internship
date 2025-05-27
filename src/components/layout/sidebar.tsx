import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  Users,
  PercentCircle,
  CreditCard,
  FileText,
  ShieldCheck,
  Settings,
  Folder,
  Bell,
  Link as LinkIcon,
  ChevronsUpDown,
  Home,
  Library,
  Building2,
  UserPlus,
  Wallet,
  LineChart,
  FileBarChart,
  BookOpen,
  Globe,
  Megaphone,
  MessagesSquare,
  Plus,
  Package
} from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
}

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isCurrent: boolean;
  badge?: string | number;
}

interface SidebarGroupProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

// Individual sidebar item
const SidebarItem: React.FC<SidebarItemProps> = ({ href, icon, title, isCurrent, badge }) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
        isCurrent
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{title}</span>
      </div>
      {badge && (
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
          {badge}
        </span>
      )}
    </Link>
  );
};

// Collapsible group of sidebar items
const SidebarGroup: React.FC<SidebarGroupProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
        <div className="flex items-center gap-3">
          {icon}
          <span>{title}</span>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 pt-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, isMobile, onClose }) => {
  const location = useLocation();
  const { user, role } = useAuthStore();

  // Check if the current path matches a given path
  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Filter menu items based on user permissions
  const hasPermission = (requiredPermission: string) => {
    if (!role || !role.permissions) return false;
    return role.permissions.includes(requiredPermission) || role.permissions.includes('*');
  };

  // Permission checks
  const canViewDashboard = useMemo(() => true, []); // Everyone can view dashboard
  const canViewAffiliates = useMemo(() => hasPermission('affiliates:view'), [role]);
  const canViewCommissions = useMemo(() => hasPermission('commissions:view'), [role]);
  const canViewPayments = useMemo(() => hasPermission('payments:view'), [role]);
  const canViewReports = useMemo(() => hasPermission('reports:view'), [role]);
  const canViewFraud = useMemo(() => hasPermission('fraud:view'), [role]);
  const canViewContent = useMemo(() => hasPermission('content:view'), [role]);
  const canViewNotifications = useMemo(() => hasPermission('notifications:view'), [role]);
  const canViewIntegrations = useMemo(() => hasPermission('integrations:view'), [role]);
  const canManageTenant = useMemo(() => hasPermission('tenant:manage'), [role]);

  const isAffiliate = useMemo(() => user?.isAffiliate, [user]);

  // Handle sidebar click in mobile view
  const handleSidebarClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  // Early return if sidebar is closed
  if (!isOpen) {
    return null;
  }

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r bg-background pt-16 transition-transform duration-300 ease-in-out",
        isMobile ? "fixed" : "relative",
        isMobile && !isOpen && "-translate-x-full"
      )}
    >
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-10" 
          onClick={onClose}
        />
      )}
      
      <ScrollArea className="flex-1 py-2 px-4">
        <div className="space-y-1" onClick={handleSidebarClick}>
          {/* Dashboard */}
          <SidebarItem
            href="/"
            icon={<BarChart3 className="h-4 w-4" />}
            title="Dashboard"
            isCurrent={isActivePath('/')} />

          {/* Products Management */}
          <SidebarGroup 
            title="Products" 
            icon={<Package className="h-5 w-5" />}
            defaultOpen={isActivePath('/products')}
          >
            <SidebarItem
              href="/products"
              icon={<Package className="h-4 w-4" />}
              title="All Products"
              isCurrent={isActivePath('/products')}
            />
            <SidebarItem
              href="/products/create"
              icon={<Plus className="h-4 w-4" />}
              title="Add Product"
              isCurrent={isActivePath('/products/create')}
            />
          </SidebarGroup>

          {/* Affiliate Management */}
          <SidebarGroup 
            title="Affiliate Management" 
            icon={<Users className="h-5 w-5" />}
            defaultOpen={isActivePath('/affiliates')}
          >
            <SidebarItem
              href="/affiliates"
              icon={<Users className="h-4 w-4" />}
              title="All Affiliates"
              isCurrent={isActivePath('/affiliates')}
            />
            <SidebarItem
              href="/affiliates/pending"
              icon={<UserPlus className="h-4 w-4" />}
              title="Pending Approvals"
              isCurrent={isActivePath('/affiliates/pending')}
            />
            <SidebarItem
              href="/affiliates/tiers"
              icon={<Building2 className="h-4 w-4" />}
              title="Affiliate Tiers"
              isCurrent={isActivePath('/affiliates/tiers')}
            />
          </SidebarGroup>

          {/* Campaigns */}
          <SidebarGroup
            title="Campaigns"
            icon={<Megaphone className="h-5 w-5" />}
            defaultOpen={isActivePath('/campaigns')}
          >
            <SidebarItem
              href="/campaigns"
              icon={<Megaphone className="h-4 w-4" />}
              title="All Campaigns"
              isCurrent={isActivePath('/campaigns')}
            />
            <SidebarItem
              href="/campaigns/create"
              icon={<Plus className="h-4 w-4" />}
              title="Create Campaign"
              isCurrent={isActivePath('/campaigns/create')}
            />
          </SidebarGroup>

          {/* Commissions */}
          <SidebarGroup 
            title="Commissions" 
            icon={<PercentCircle className="h-5 w-5" />}
            defaultOpen={isActivePath('/commissions')}
          >
            <SidebarItem
              href="/commissions/tiers"
              icon={<PercentCircle className="h-4 w-4" />}
              title="Commission Tiers"
              isCurrent={isActivePath('/commissions/tiers')}
            />
            <SidebarItem
              href="/commissions/products"
              icon={<PercentCircle className="h-4 w-4" />}
              title="Product Commissions"
              isCurrent={isActivePath('/commissions/products')}
            />
            <SidebarItem
              href="/commissions/rules"
              icon={<FileText className="h-4 w-4" />}
              title="Commission Rules"
              isCurrent={isActivePath('/commissions/rules')}
            />
          </SidebarGroup>

          {/* Payments */}
          <SidebarGroup 
            title="Payments" 
            icon={<CreditCard className="h-5 w-5" />}
            defaultOpen={isActivePath('/payments')}
          >
            <SidebarItem
              href="/payments/payouts"
              icon={<Wallet className="h-4 w-4" />}
              title="Payouts"
              isCurrent={isActivePath('/payments/payouts')}
            />
            <SidebarItem
              href="/payments/methods"
              icon={<CreditCard className="h-4 w-4" />}
              title="Payment Methods"
              isCurrent={isActivePath('/payments/methods')}
            />
            <SidebarItem
              href="/payments/history"
              icon={<FileText className="h-4 w-4" />}
              title="Payment History"
              isCurrent={isActivePath('/payments/history')}
            />
          </SidebarGroup>

          {/* Analytics */}
          <SidebarGroup 
            title="Analytics" 
            icon={<LineChart className="h-5 w-5" />}
            defaultOpen={isActivePath('/analytics')}
          >
            <SidebarItem
              href="/analytics/reports"
              icon={<FileBarChart className="h-4 w-4" />}
              title="Reports"
              isCurrent={isActivePath('/analytics/reports')}
            />
            <SidebarItem
              href="/analytics/dashboard"
              icon={<BarChart3 className="h-4 w-4" />}
              title="Custom Dashboard"
              isCurrent={isActivePath('/analytics/dashboard')}
            />
          </SidebarGroup>

          {/* Settings */}
          <SidebarGroup
            title="Settings"
            icon={<Settings className="h-5 w-5" />}
            defaultOpen={isActivePath('/settings')}
          >
            <SidebarItem
              href="/settings/general"
              icon={<Settings className="h-4 w-4" />}
              title="General"
              isCurrent={isActivePath('/settings/general')}
            />
            <SidebarItem
              href="/settings/users"
              icon={<Users className="h-4 w-4" />}
              title="Users & Roles"
              isCurrent={isActivePath('/settings/users')}
            />
            <SidebarItem
              href="/settings/billing"
              icon={<CreditCard className="h-4 w-4" />}
              title="Billing"
              isCurrent={isActivePath('/settings/billing')}
            />
          </SidebarGroup>
        </div>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;