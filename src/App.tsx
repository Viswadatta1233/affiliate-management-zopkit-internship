import { ThemeProvider } from 'next-themes';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import AppShell from '@/components/layout/app-shell';
import SuperAdminShell from '@/components/layout/super-admin-shell';
import InfluencerShell from '@/components/layout/influencer-shell';
import AffiliateShell from '@/components/layout/affiliate-shell';
import { Toaster } from 'react-hot-toast';
import React, { useEffect, Suspense } from 'react';

// Import pages
import Dashboard from '@/pages/dashboard';
import Affiliates from '@/pages/affiliates/index';
import AffiliateProfile from '@/pages/affiliates/profile';
import PendingAffiliates from '@/pages/affiliates/pending';
import AffiliateTiers from '@/pages/affiliates/tiers';
import InviteAffiliatePage from '@/pages/affiliates/invite';
import TrackingLinks from '@/pages/tracking-links';
import CreateTrackingLink from '@/pages/tracking-links/create';
import CommissionTiers from '@/pages/commissions/tiers';
import CreateCommissionTier from '@/pages/commissions/create-tier';
import ProductCommissions from '@/pages/commissions/products';
import CommissionRules from '@/pages/commissions/rules';
import CreateCommissionRule from '@/pages/commissions/create-rule';
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
import CreateCampaign from '@/pages/marketing/createCampaign';
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
import InfluencerRegistration from '@/pages/auth/register/influencer';
import NotFound from '@/pages/not-found';
import Products from '@/pages/products';
import CreateProduct from '@/pages/products/create';
import EditProduct from '@/pages/products/edit';
import AcceptInvite from '@/pages/affiliate/accept';
import AffiliateDashboard from '@/pages/affiliate/dashboard';
import AffiliateProfilePage from '@/pages/affiliate/profile';
import AffiliateChangePassword from '@/pages/affiliate/change-password';
import AffiliateTrackingLinks from '@/pages/affiliate/links';
import AffiliateCommissions from '@/pages/affiliate/commissions';
import SuperAdminDashboard from '@/pages/super-admin/dashboard';
import InfluencerDashboard from '@/pages/influencer/dashboard';
import InfluencerCampaigns from '@/pages/influencer/campaigns';
import InfluencerSettingsProfile from '@/pages/influencer/settings/profile';
import InfluencerSettingsSecurity from '@/pages/influencer/settings/security';
import InfluencerSettingsNotifications from '@/pages/influencer/settings/notifications';
import InfluencerSupportHub from '@/pages/influencer/support-hub';
import CampaignDetails from '@/pages/marketing/campaign-details';
import CampaignInfluencers from '@/pages/marketing/campaign-influencers';
import InfluencerCampaignDetails from '@/pages/influencer/campaign-details';

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

// Route guard for super admin routes
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || user?.email !== 'zopkit@gmail.com') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Route guard for influencer routes
const InfluencerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const hasInfluencerRole = role?.roleName === 'potential_influencer' || role?.roleName === 'influencer';

  if (!isAuthenticated || !hasInfluencerRole) {
    console.log('Redirecting: isAuthenticated:', isAuthenticated, 'hasInfluencerRole:', hasInfluencerRole, 'role:', role);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Route guard for non-influencer routes
const NonInfluencerRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const hasInfluencerRole = role?.roleName === 'potential_influencer' || role?.roleName === 'influencer';

  if (isAuthenticated && hasInfluencerRole) {
    return <Navigate to="/influencer/dashboard" replace />;
  }

  return <>{children}</>;
};

// Route guard for affiliate routes
const AffiliateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user?.isAffiliate) {
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
          <Route path="/register/influencer" element={<InfluencerRegistration />} />
          
          {/* Super Admin Routes */}
          <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminShell /></SuperAdminRoute>}>
            <Route path="dashboard" element={<SuperAdminDashboard />} />
          </Route>
          
          {/* Influencer Routes */}
          <Route path="/influencer" element={<InfluencerRoute><InfluencerShell /></InfluencerRoute>}>
            <Route path="dashboard" element={<InfluencerDashboard />} />
            <Route path="campaigns" element={<InfluencerCampaigns />} />
            <Route path="campaigns/:id" element={<InfluencerCampaignDetails />} />
            <Route path="settings/profile" element={<InfluencerSettingsProfile />} />
            <Route path="settings/security" element={<InfluencerSettingsSecurity />} />
            <Route path="settings/notifications" element={<InfluencerSettingsNotifications />} />
            <Route path="support-hub" element={<InfluencerSupportHub />} />
            <Route path="*" element={<Navigate to="/influencer/dashboard" replace />} />
          </Route>
          
          {/* Public affiliate accept route */}
          <Route path="/affiliate/accept" element={<AcceptInvite />} />
          
          {/* Affiliate routes */}
          <Route path="/affiliate" element={<AffiliateRoute><AffiliateShell /></AffiliateRoute>}>
            <Route path="dashboard" element={<AffiliateDashboard />} />
            <Route path="profile" element={<AffiliateProfilePage />} />
            <Route path="change-password" element={<AffiliateChangePassword />} />
            <Route path="links" element={<AffiliateTrackingLinks />} />
            <Route path="commissions" element={<AffiliateCommissions />} />
            <Route path="*" element={<Navigate to="/affiliate/dashboard" replace />} />
          </Route>
          
          {/* App routes - protected, with AppShell/sidebar */}
          <Route path="/" element={<NonInfluencerRoute><PrivateRoute><AppShell /></PrivateRoute></NonInfluencerRoute>}>
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
              <Route path="invite" element={<InviteAffiliatePage />} />
            </Route>
            
            {/* Tracking Links */}
            <Route path="tracking-links" element={<TrackingLinks />} />
            <Route path="tracking-links/create" element={<CreateTrackingLink />} />
            
            {/* Commissions */}
            <Route path="commissions">
              <Route path="tiers" element={<CommissionTiers />} />
              <Route path="tiers/create" element={<CreateCommissionTier />} />
              <Route path="products" element={<ProductCommissions />} />
              <Route path="rules" element={<CommissionRules />} />
              <Route path="rules/create" element={<CreateCommissionRule />} />
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
              <Route path="create-campaign" element={<CreateCampaign />} />
              <Route path="resources" element={<MarketingResources />} />
              <Route path="campaigns" element={<MarketingCampaigns />} />
              <Route path="campaigns/:id" element={<CampaignDetails />} />
              <Route path="campaigns/:id/influencers" element={<CampaignInfluencers />} />
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
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;