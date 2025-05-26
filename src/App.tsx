import { ThemeProvider } from 'next-themes';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import AppShell from '@/components/layout/app-shell';
import { Toaster } from '@/components/ui/sonner';

// Import pages
import Dashboard from '@/pages/dashboard';
import Affiliates from '@/pages/affiliates/index';
import AffiliateProfile from '@/pages/affiliates/profile';
import PendingAffiliates from '@/pages/affiliates/pending';
import AffiliateTiers from '@/pages/affiliates/tiers';
import TrackingLinks from '@/pages/tracking-links';
import CommissionTiers from '@/pages/commissions/tiers';
import ProductCommissions from '@/pages/commissions/products';
import CommissionRules from '@/pages/commissions/rules';
import Payouts from '@/pages/payments/payouts';
import PaymentMethods from '@/pages/payments/methods';
import PaymentHistory from '@/pages/payments/history';
import Reports from '@/pages/analytics/reports';
import CustomDashboard from '@/pages/analytics/dashboard';
import FraudMonitoring from '@/pages/fraud/monitoring';
import FraudRules from '@/pages/fraud/rules';
import FraudAlerts from '@/pages/fraud/alerts';
import MarketingResources from '@/pages/marketing/resources';
import MarketingCampaigns from '@/pages/marketing/campaigns';
import InfluencerSearch from '@/pages/marketing/influencer-search';
import KnowledgeBase from '@/pages/marketing/knowledge-base';
import Notifications from '@/pages/communications/notifications';
import NotificationTemplates from '@/pages/communications/templates';
import ApiKeys from '@/pages/integrations/api-keys';
import Webhooks from '@/pages/integrations/webhooks';
import GeneralSettings from '@/pages/settings/general';
import UsersAndRoles from '@/pages/settings/users';
import Billing from '@/pages/settings/billing';
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';
import NotFound from '@/pages/not-found';
import Products from '@/pages/products';
import CreateProduct from '@/pages/products/create';
import EditProduct from '@/pages/products/edit';
import AcceptInvite from '@/pages/affiliate/accept';
import AffiliateDashboard from '@/pages/affiliate/dashboard';

// Route guard for authenticated routes
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Public affiliate accept route */}
          <Route path="/affiliate/accept" element={<AcceptInvite />} />
          
          {/* Public affiliate dashboard route (no AppShell/sidebar) */}
          <Route path="/affiliate/dashboard" element={<AffiliateDashboard />} />
          
          {/* App routes - protected, with AppShell/sidebar */}
          <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            
            {/* Products */}
            <Route path="products">
              <Route index element={<Products />} />
              <Route path="create" element={<CreateProduct />} />
              <Route path=":id/edit" element={<EditProduct />} />
            </Route>
            
            {/* Affiliate Management */}
            <Route path="affiliates">
              <Route index element={<Affiliates />} />
              <Route path=":id" element={<AffiliateProfile />} />
              <Route path="pending" element={<PendingAffiliates />} />
              <Route path="tiers" element={<AffiliateTiers />} />
            </Route>
            
            {/* Tracking Links */}
            <Route path="tracking-links" element={<TrackingLinks />} />
            
            {/* Commissions */}
            <Route path="commissions">
              <Route path="tiers" element={<CommissionTiers />} />
              <Route path="products" element={<ProductCommissions />} />
              <Route path="rules" element={<CommissionRules />} />
            </Route>
            
            {/* Payments */}
            <Route path="payments">
              <Route path="payouts" element={<Payouts />} />
              <Route path="methods" element={<PaymentMethods />} />
              <Route path="history" element={<PaymentHistory />} />
            </Route>
            
            {/* Analytics */}
            <Route path="analytics">
              <Route path="reports" element={<Reports />} />
              <Route path="dashboard" element={<CustomDashboard />} />
            </Route>
            
            {/* Fraud Prevention */}
            <Route path="fraud">
              <Route path="monitoring" element={<FraudMonitoring />} />
              <Route path="rules" element={<FraudRules />} />
              <Route path="alerts" element={<FraudAlerts />} />
            </Route>
            
            {/* Marketing */}
            <Route path="marketing">
              <Route path="resources" element={<MarketingResources />} />
              <Route path="campaigns" element={<MarketingCampaigns />} />
              <Route path="influencer-search" element={<InfluencerSearch />} />
              <Route path="knowledge-base" element={<KnowledgeBase />} />
            </Route>
            
            {/* Communications */}
            <Route path="communications">
              <Route path="notifications" element={<Notifications />} />
              <Route path="templates" element={<NotificationTemplates />} />
            </Route>
            
            {/* Integrations */}
            <Route path="integrations">
              <Route path="api-keys" element={<ApiKeys />} />
              <Route path="webhooks" element={<Webhooks />} />
            </Route>
            
            {/* Settings */}
            <Route path="settings">
              <Route path="general" element={<GeneralSettings />} />
              <Route path="users" element={<UsersAndRoles />} />
              <Route path="billing" element={<Billing />} />
            </Route>
          </Route>
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;