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
  Package,
  Key,
  List,
  DollarSign,
  User,
  LayoutDashboard,
  Target
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

interface MenuItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

// Individual sidebar item
const SidebarItem: React.FC<SidebarItemProps & { onClick?: () => void }> = ({ href, icon, title, isCurrent, badge, onClick }) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
        isCurrent
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted"
      )}
      onClick={onClick}
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
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 px-3 text-sm text-muted-foreground hover:bg-muted hover:text-accent-foreground rounded-md transition-colors bg-transparent">
        <div className="flex items-center gap-3">
          {icon}
          <span className="text-muted-foreground font-medium">{title}</span>
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
  const { user, role, tenant } = useAuthStore();
  const t = tenant;

  // Check if the current path matches a given path
  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Filter menu items based on user role
  const hasAccess = (menuItem: MenuItem) => {
    if (!role) return false;
    return true; // All authenticated users have access
  };

  // Role-based access checks
  const canViewDashboard = useMemo(() => true, []); // Everyone can view dashboard
  const canViewAffiliates = useMemo(() => true, []);
  const canViewCommissions = useMemo(() => true, []);
  const canViewPayments = useMemo(() => true, []);
  const canViewReports = useMemo(() => true, []);
  const canViewFraud = useMemo(() => true, []);
  const canViewContent = useMemo(() => true, []);
  const canViewNotifications = useMemo(() => true, []);
  const canViewIntegrations = useMemo(() => true, []);
  const canManageTenant = useMemo(() => true, []);

  const isAffiliate = useMemo(() => user?.isAffiliate, [user]);
  const isInfluencer = useMemo(() => {
    const roleName = user?.role?.roleName;
    return roleName === 'influencer' || roleName === 'potential_influencer';
  }, [user?.role?.roleName]);

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

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      href: '/',
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ['Tenant Admin', 'super-admin']
    },
    {
      title: 'Dashboard',
      href: '/influencer/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ['influencer', 'potential_influencer']
    },
    {
      title: 'Campaigns',
      href: '/influencer/campaigns',
      icon: <Target className="h-5 w-5" />,
      roles: ['influencer', 'potential_influencer']
    },
    // ... rest of the existing menu items ...
  ];

  return (
    <aside 
      className={cn(
        // Responsive width and positioning
        "z-20 flex flex-col border-r bg-white pt-2 shadow-sm transition-transform duration-300 ease-in-out",
        isMobile
          ? `fixed inset-y-0 left-0 w-64 max-w-full transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`
          : "relative w-64",
      )}
      aria-label="Sidebar"
    >
      {/* Mobile close button */}
      {isMobile && (
        <button
          className="absolute top-3 right-3 z-40 p-2 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}
      {/* Tenant Name Display */}
      {t?.tenantName ? (
        <div className="px-4 pt-2 pb-4 flex flex-col items-center">
          <div className="flex items-center justify-center w-full mb-2">
            {t.logoUrl ? (
              <img
                src={t.logoUrl}
                alt={`${t.tenantName} Logo`}
                className="h-10 w-auto min-w-[2.5rem] rounded-full bg-white border-2 border-white shadow"
              />
            ) : (
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-400 text-white text-2xl font-bold shadow-md border-2 border-white">
                {(t.tenantName[0] || '?').toUpperCase()}
              </span>
            )}
          </div>
          <div className="rounded-xl bg-gradient-to-tr from-blue-50 to-indigo-100 text-blue-900 font-extrabold text-xl text-center tracking-wide shadow border border-blue-200 px-4 py-2 w-full">
            {t.tenantName}
          </div>
        </div>
      ) : (
        <div className="px-4 pt-2 pb-3 text-center text-xs text-muted-foreground">No tenant loaded</div>
      )}
      <ScrollArea className="flex-1 py-2 px-4">
        <div className="space-y-1" onClick={handleSidebarClick}>
          {isInfluencer ? (
            <SidebarItem
              href="/influencer/dashboard"
              icon={<Home className="h-4 w-4" />}
              title="Influencer Dashboard"
              isCurrent={isActivePath('/influencer/dashboard')}
              onClick={handleSidebarClick}
            />
          ) : (
            <>
              {/* Dashboard for non-influencers */}
              <SidebarItem
                href="/"
                icon={<Home className="h-4 w-4" />}
                title="Dashboard"
                isCurrent={isActivePath('/')}
                onClick={handleSidebarClick}
              />
              {/* Regular tenant menu items */}
              {/* Products */}
              <SidebarGroup 
                title="Products" 
                icon={<Package className="h-5 w-5" />}
                defaultOpen={isActivePath('/products')}
              >
                <SidebarItem
                  href="/products/create"
                  icon={<Plus className="h-4 w-4" />}
                  title="Create Product"
                  isCurrent={isActivePath('/products/create')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/products"
                  icon={<Package className="h-4 w-4" />}
                  title="All Products"
                  isCurrent={isActivePath('/products')}
                  onClick={handleSidebarClick}
                />
              </SidebarGroup>

              {/* Affiliate Management */}
              <SidebarGroup
                title="Affiliates" 
                icon={<Users className="h-5 w-5" />}
                defaultOpen={isActivePath('/affiliates')}
              >
                <SidebarItem
                  href="/affiliates"
                  icon={<Users className="h-4 w-4" />}
                  title="All Affiliates"
                  isCurrent={isActivePath('/affiliates')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/affiliates/pending"
                  icon={<UserPlus className="h-4 w-4" />}
                  title="Pending Affiliates"
                  isCurrent={isActivePath('/affiliates/pending')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/affiliates/tiers"
                  icon={<Building2 className="h-4 w-4" />}
                  title="Affiliate Tiers"
                  isCurrent={isActivePath('/affiliates/tiers')}
                  onClick={handleSidebarClick}
                />


              
              {/* Tracking Links */}
              <SidebarItem
                href="/tracking-links"
                icon={<LinkIcon className="h-4 w-4" />}
                title="Tracking Links"
                isCurrent={isActivePath('/tracking-links')}
                onClick={handleSidebarClick}
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
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/commissions/products"
                  icon={<Package className="h-4 w-4" />}
                  title="Product Commissions"
                  isCurrent={isActivePath('/commissions/products')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/commissions/rules"
                  icon={<FileText className="h-4 w-4" />}
                  title="Commission Rules"
                  isCurrent={isActivePath('/commissions/rules')}
                  onClick={handleSidebarClick}
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
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/payments/methods"
                  icon={<CreditCard className="h-4 w-4" />}
                  title="Payment Methods"
                  isCurrent={isActivePath('/payments/methods')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/payments/history"
                  icon={<FileText className="h-4 w-4" />}
                  title="Payment History"
                  isCurrent={isActivePath('/payments/history')}
                  onClick={handleSidebarClick}
                />
              </SidebarGroup>

              {/* Analytics */}
              <SidebarGroup
                title="Analytics" 
                icon={<BarChart3 className="h-5 w-5" />}
                defaultOpen={isActivePath('/analytics')}
              >
                <SidebarItem
                  href="/analytics/reports"
                  icon={<FileBarChart className="h-4 w-4" />}
                  title="Reports"
                  isCurrent={isActivePath('/analytics/reports')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/analytics/dashboard"
                  icon={<BarChart3 className="h-4 w-4" />}
                  title="Custom Dashboard"
                  isCurrent={isActivePath('/analytics/dashboard')}
                  onClick={handleSidebarClick}
                />
              </SidebarGroup>

              {/* Fraud Prevention */}
              <SidebarGroup
                title="Fraud Prevention"
                icon={<ShieldCheck className="h-5 w-5" />}
                defaultOpen={isActivePath('/fraud')}
              >
                <SidebarItem
                  href="/fraud/monitoring"
                  icon={<BarChart3 className="h-4 w-4" />}
                  title="Monitoring"
                  isCurrent={isActivePath('/fraud/monitoring')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/fraud/rules"
                  icon={<FileText className="h-4 w-4" />}
                  title="Rules"
                  isCurrent={isActivePath('/fraud/rules')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/fraud/alerts"
                  icon={<Bell className="h-4 w-4" />}
                  title="Alerts"
                  isCurrent={isActivePath('/fraud/alerts')}
                  onClick={handleSidebarClick}
                />
              </SidebarGroup>

              {/* Marketing */}
              <SidebarGroup
                title="Marketing"
                icon={<Megaphone className="h-5 w-5" />}
                defaultOpen={isActivePath('/marketing')}
              >
                <SidebarItem
                  href="/marketing/create-campaign"
                  icon={<Plus className="h-4 w-4" />}
                  title="Create Campaign"
                  isCurrent={isActivePath('/marketing/create-campaign')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/marketing/campaigns"
                  icon={<Megaphone className="h-4 w-4" />}
                  title="All Campaigns"
                  isCurrent={isActivePath('/marketing/campaigns')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/marketing/resources"
                  icon={<Folder className="h-4 w-4" />}
                  title="Resources"
                  isCurrent={isActivePath('/marketing/resources')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/marketing/influencer-search"
                  icon={<Users className="h-4 w-4" />}
                  title="Influencer Search"
                  isCurrent={isActivePath('/marketing/influencer-search')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/marketing/knowledge-base"
                  icon={<BookOpen className="h-4 w-4" />}
                  title="Knowledge Base"
                  isCurrent={isActivePath('/marketing/knowledge-base')}
                  onClick={handleSidebarClick}
                />
              </SidebarGroup>

              {/* Communications */}
              <SidebarGroup
                title="Communications"
                icon={<MessagesSquare className="h-5 w-5" />}
                defaultOpen={isActivePath('/communications')}
              >
                <SidebarItem
                  href="/communications/notifications"
                  icon={<Bell className="h-4 w-4" />}
                  title="Notifications"
                  isCurrent={isActivePath('/communications/notifications')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/communications/templates"
                  icon={<FileText className="h-4 w-4" />}
                  title="Templates"
                  isCurrent={isActivePath('/communications/templates')}
                  onClick={handleSidebarClick}
                />
              </SidebarGroup>

              {/* Integrations */}
              <SidebarGroup
                title="Integrations"
                icon={<Globe className="h-5 w-5" />}
                defaultOpen={isActivePath('/integrations')}
              >
                <SidebarItem
                  href="/integrations/api-keys"
                  icon={<Key className="h-4 w-4" />}
                  title="API Keys"
                  isCurrent={isActivePath('/integrations/api-keys')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/integrations/webhooks"
                  icon={<Globe className="h-4 w-4" />}
                  title="Webhooks"
                  isCurrent={isActivePath('/integrations/webhooks')}
                  onClick={handleSidebarClick}
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
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/settings/users"
                  icon={<Users className="h-4 w-4" />}
                  title="Users & Roles"
                  isCurrent={isActivePath('/settings/users')}
                  onClick={handleSidebarClick}
                />
                <SidebarItem
                  href="/settings/billing"
                  icon={<CreditCard className="h-4 w-4" />}
                  title="Billing"
                  isCurrent={isActivePath('/settings/billing')}
                  onClick={handleSidebarClick}
                />
              </SidebarGroup>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;