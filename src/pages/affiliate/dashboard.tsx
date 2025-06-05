import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { apiProducts } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  DollarSign, 
  Globe, 
  Instagram, 
  Link2, 
  Mail, 
  MapPin, 
  Phone, 
  Star, 
  TrendingUp, 
  Twitter, 
  Youtube,
  Home,
  Users,
  Settings,
  BarChart,
  Link,
  CreditCard,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TrackingLink {
  id: string;
  productId: string;
  trackingCode: string;
  totalClicks: number;
  totalConversions: number;
  totalSales: number;
  product: any | null;
}

interface AffiliateDetails {
  id: string;
  tenantId: string;
  tenantName: string;
  userId: string;
  referralCode: string;
  currentTier: string;
  websiteUrl: string;
  socialMedia: Record<string, string>;
  promotionalMethods: string[];
  email?: string;
}

const SOCIAL_MEDIA_OPTIONS = [
  { label: 'Facebook', value: 'facebook' },
  { label: 'Twitter', value: 'twitter' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'TikTok', value: 'tiktok' },
];

const PROMO_METHOD_OPTIONS = [
  'Blog',
  'YouTube',
  'Instagram',
  'Facebook',
  'Twitter',
  'Email Marketing',
  'Paid Ads',
  'SEO',
  'Other',
];

function isValidUrl(url: string) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

const sidebarNavItems = [
  {
    title: "Overview",
    href: "/affiliate/dashboard",
    icon: Home,
  },
  {
    title: "Performance",
    href: "/affiliate/performance",
    icon: BarChart,
  },
  {
    title: "Links",
    href: "/affiliate/links",
    icon: Link,
  },
  {
    title: "Payouts",
    href: "/affiliate/payouts",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/affiliate/settings",
    icon: Settings,
  },
];

export default function AffiliateDashboard() {
  const { toast } = useToast();
  const [productMap, setProductMap] = useState<Record<string, any>>({});
  const tenant = useAuthStore((state) => state.tenant);
  const queryClient = useQueryClient();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState({
    websiteUrl: '',
    socialMedia: {} as Record<string, string>,
    promotionalMethods: [] as string[],
    selectedSocial: '',
    socialUrl: '',
  });
  const [formError, setFormError] = useState('');
  const location = useLocation();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { data: trackingLinks, isLoading, error } = useQuery<TrackingLink[]>({
    queryKey: ['affiliate-dashboard'],
    queryFn: async () => {
      const response = await api.get('/api/affiliates/dashboard');
      return response.data.trackingLinks.map((link: any) => ({
        id: link.id,
        productId: link.productId,
        trackingCode: link.trackingCode,
        totalClicks: link.totalClicks,
        totalConversions: link.totalConversions,
        totalSales: typeof link.totalSales === 'string' ? parseFloat(link.totalSales) : (link.totalSales ?? 0),
        product: link.product,
      }));
    },
  });

  const { data: productCommissions, isLoading: isLoadingComms } = useQuery<any[]>({
    queryKey: ['affiliate-product-commissions'],
    queryFn: async () => {
      const response = await api.get('/api/affiliates/product-commissions');
      return response.data;
    },
  });

  // Fetch affiliate details
  const { data: affiliateDetails } = useQuery<AffiliateDetails, Error>({
    queryKey: ['affiliate-details'],
    queryFn: async () => {
      const response = await api.get('/api/affiliates/details');
      const data = response.data as AffiliateDetails;
      setProfileForm(f => ({
        ...f,
        websiteUrl: data.websiteUrl || '',
        socialMedia: data.socialMedia || {},
        promotionalMethods: data.promotionalMethods || [],
      }));
      return data;
    }
  });

  // Fetch commission tier name if currentTier is present
  const { data: tierName } = useQuery<string, Error>({
    queryKey: ['commission-tier-name', affiliateDetails?.currentTier],
    queryFn: async () => {
      if (!affiliateDetails?.currentTier) return '';
      const res = await api.get(`/api/commissions/tiers`);
      const tier = res.data.find((t: any) => t.id === affiliateDetails.currentTier);
      return tier ? tier.tierName || tier.tier_name : affiliateDetails.currentTier;
    },
    enabled: !!affiliateDetails?.currentTier
  });

  // Update affiliate details mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (payload: any) => api.put('/api/affiliates/details', payload),
    onSuccess: () => {
      setFormError('');
      toast({ title: 'Profile updated' });
      setShowProfileForm(false);
      queryClient.invalidateQueries({ queryKey: ['affiliate-details'] });
    },
    onError: () => setFormError('Please check your inputs. Website and social media URLs must be valid.'),
  });

  // Get affiliate email from auth store (or affiliateDetails if available)
  const affiliateEmail = useAuthStore((state) => state.user?.email) || affiliateDetails?.email;

  // Handle add social media
  const handleAddSocial = () => {
    if (!profileForm.selectedSocial) return;
    if (!isValidUrl(profileForm.socialUrl)) {
      setFormError('Please enter a valid URL for the selected social media.');
      return;
    }
    setProfileForm(f => ({
      ...f,
      socialMedia: { ...f.socialMedia, [f.selectedSocial]: f.socialUrl },
      selectedSocial: '',
      socialUrl: '',
    }));
    setFormError('');
  };

  // Handle remove social media
  const handleRemoveSocial = (platform: string) => {
    setProfileForm(f => {
      const updated = { ...f.socialMedia };
      delete updated[platform];
      return { ...f, socialMedia: updated };
    });
  };

  // Handle promo method toggle
  const handlePromoToggle = (method: string) => {
    setProfileForm(f =>
      f.promotionalMethods.includes(method)
        ? { ...f, promotionalMethods: f.promotionalMethods.filter(m => m !== method) }
        : { ...f, promotionalMethods: [...f.promotionalMethods, method] }
    );
  };

  // Handle form submit
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate website URL if present
    if (profileForm.websiteUrl && !isValidUrl(profileForm.websiteUrl)) {
      setFormError('Please enter a valid website URL or leave it blank.');
      return;
    }
    // Validate all social media URLs
    for (const url of Object.values(profileForm.socialMedia)) {
      if (url && !isValidUrl(url)) {
        setFormError('Please enter valid URLs for all social media links.');
        return;
      }
    }
    setFormError('');
    // Only send non-empty, valid fields
    const payload: any = {
      promotionalMethods: profileForm.promotionalMethods,
    };
    if (profileForm.websiteUrl) payload.websiteUrl = profileForm.websiteUrl;
    if (Object.keys(profileForm.socialMedia).length > 0) payload.socialMedia = profileForm.socialMedia;
    updateProfileMutation.mutate(payload);
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      setPasswordError('All fields are required.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.put('/api/affiliates/update-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast({ title: 'Password updated successfully' });
      setPasswordDialogOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error: any) {
      setPasswordError(error?.response?.data?.error || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Fetch missing product details
  useEffect(() => {
    if (!trackingLinks) return;
    const missingProductIds = trackingLinks
      .filter(link => !link.product && link.productId)
      .map(link => link.productId)
      .filter((id, idx, arr) => arr.indexOf(id) === idx && !productMap[id]);
    if (missingProductIds.length === 0) return;

    Promise.all(missingProductIds.map(id => apiProducts.getById(id)))
      .then(results => {
        const newMap: Record<string, any> = {};
        results.forEach((res, idx) => {
          newMap[missingProductIds[idx]] = res.data;
        });
        setProductMap(prev => ({ ...prev, ...newMap }));
      });
  }, [trackingLinks]);

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/track/${code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Tracking link copied!',
      description: 'The tracking link has been copied to your clipboard.',
    });
  };

  const handleLogout = () => {
    // Clear auth state
    useAuthStore.getState().logout();
    // Clear query cache
    queryClient.clear();
    // Redirect to login
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'Failed to load dashboard'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col gap-4 border-r bg-gray-100/40 h-full px-5 py-8">
          <div className="flex items-center gap-2 px-4 mb-2">
            <h2 className="text-2xl font-bold tracking-tight">Affiliate Panel</h2>
          </div>
          <Separator className="mb-4" />
          <nav className="flex flex-col gap-2 px-2 flex-1">
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <RouterLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900",
                    location.pathname === item.href ? "bg-gray-100 text-gray-900" : ""
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </RouterLink>
              );
            })}
          </nav>
          
          {/* Logout Button */}
          <div className="px-2 mt-auto">
            <Separator className="my-4" />
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-100/50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72 flex flex-col flex-1">
        <main className="flex-1 py-8">
          <div className="px-4 sm:px-8 mx-auto max-w-7xl">
        {/* Tenant Card */}
            <Card className="shadow-lg border-primary/20 hover:border-primary/40 transition-colors mb-8">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-primary">{tenant?.tenantName || 'Affiliate Program'}</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">
                  Welcome to the affiliate dashboard for <span className="font-semibold">{tenant?.tenantName || 'your program'}</span>
            </CardDescription>
          </CardHeader>
        </Card>

            {/* Stats Overview */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                      <h3 className="text-2xl font-bold">
                        {trackingLinks?.reduce((sum, link) => sum + link.totalClicks, 0) || 0}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                      <h3 className="text-2xl font-bold">
                        {trackingLinks?.reduce((sum, link) => sum + link.totalConversions, 0) || 0}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                      <h3 className="text-2xl font-bold">
                        ${trackingLinks?.reduce((sum, link) => sum + (typeof link.totalSales === 'number' && !isNaN(link.totalSales) ? link.totalSales : 0), 0).toFixed(2) || '0.00'}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Link2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Links</p>
                      <h3 className="text-2xl font-bold">{trackingLinks?.length || 0}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Cards */}
            <div className="grid gap-8">
              {/* Profile Card */}
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/40 px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Affiliate Profile</CardTitle>
            <CardDescription>Manage your affiliate details</CardDescription>
                    </div>
                    {!showProfileForm && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowProfileForm(true)}>
                          Edit Profile
                        </Button>
                        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setPasswordDialogOpen(true)}>
                              Change Password
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Change Password</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                              {passwordError && <div className="text-red-600 text-sm text-center">{passwordError}</div>}
                              <div>
                                <label className="block text-sm font-medium mb-1">Current Password</label>
                                <input
                                  type="password"
                                  className="w-full px-3 py-2 border rounded-md"
                                  value={passwordForm.currentPassword}
                                  onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">New Password</label>
                                <input
                                  type="password"
                                  className="w-full px-3 py-2 border rounded-md"
                                  value={passwordForm.newPassword}
                                  onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                                <input
                                  type="password"
                                  className="w-full px-3 py-2 border rounded-md"
                                  value={passwordForm.confirmNewPassword}
                                  onChange={e => setPasswordForm(f => ({ ...f, confirmNewPassword: e.target.value }))}
                                  required
                                />
                              </div>
                              <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={passwordLoading}>
                                  {passwordLoading ? 'Updating...' : 'Update Password'}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
          </CardHeader>
                <CardContent className="p-6">
            {affiliateDetails && !showProfileForm ? (
                    <div className="space-y-4 max-w-2xl mx-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 place-items-center">
                        <div className="p-4 bg-muted/50 rounded-lg w-full text-center">
                          <div className="font-semibold mb-1">Referral Code</div>
                          <div className="font-mono">{affiliateDetails.referralCode}</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg w-full text-center">
                          <div className="font-semibold mb-1">Current Tier</div>
                          <div>{tierName || affiliateDetails.currentTier || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <div className="font-semibold mb-1">Email</div>
                        <div>{affiliateEmail || 'N/A'}</div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <div className="font-semibold mb-1">Website URL</div>
                        <div className="break-all">{affiliateDetails.websiteUrl || 'N/A'}</div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <div className="font-semibold mb-1">Social Media</div>
                        <div className="break-all">{Object.entries(affiliateDetails.socialMedia || {}).map(([k, v]) => v ? `${k}: ${v}` : null).filter(Boolean).join(', ') || 'N/A'}</div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <div className="font-semibold mb-1">Promotional Methods</div>
                        <div>{affiliateDetails.promotionalMethods?.join(', ') || 'N/A'}</div>
                      </div>
              </div>
            ) : (
                    <form className="space-y-6 w-full max-w-lg mx-auto px-4" onSubmit={handleProfileSubmit}>
                      {formError && <div className="text-red-600 text-sm mb-2 text-center">{formError}</div>}
                      <div className="w-full">
                        <label className="block text-center font-medium mb-2">Website URL</label>
                  <input
                    type="url"
                          className="w-full px-4 py-2 rounded-md border border-input bg-background text-center"
                    value={profileForm.websiteUrl}
                    onChange={e => setProfileForm(f => ({ ...f, websiteUrl: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                      <div className="w-full">
                        <label className="block text-center font-medium mb-2">Add Social Media</label>
                        <div className="flex gap-2 items-center justify-center mb-2">
                    <Select value={profileForm.selectedSocial} onValueChange={val => setProfileForm(f => ({ ...f, selectedSocial: val }))}>
                            <SelectTrigger className="w-[140px] text-center">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_MEDIA_OPTIONS.filter(opt => !profileForm.socialMedia[opt.value]).map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-center">{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="url"
                            className="flex-1 px-4 py-2 rounded-md border border-input bg-background text-center"
                      placeholder="https://social.com/yourprofile"
                      value={profileForm.socialUrl}
                      onChange={e => setProfileForm(f => ({ ...f, socialUrl: e.target.value }))}
                    />
                    <Button type="button" size="sm" onClick={handleAddSocial}>Add</Button>
                  </div>
                        <div className="flex flex-wrap gap-2 justify-center">
                    {Object.entries(profileForm.socialMedia).map(([platform, url]) => (
                            <div key={platform} className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-md">
                              <span className="text-sm font-medium">{SOCIAL_MEDIA_OPTIONS.find(opt => opt.value === platform)?.label || platform}:</span>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm underline text-blue-600">{url}</a>
                              <Button type="button" size="sm" variant="ghost" onClick={() => handleRemoveSocial(platform)}>×</Button>
                      </div>
                    ))}
                  </div>
                </div>
                      <div className="w-full">
                        <label className="block text-center font-medium mb-2">Promotional Methods</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 justify-items-center">
                    {PROMO_METHOD_OPTIONS.map(opt => (
                            <label key={opt} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={profileForm.promotionalMethods.includes(opt)}
                          onCheckedChange={() => handlePromoToggle(opt)}
                        />
                              <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                      <div className="flex gap-3 justify-center mt-8">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>Save</Button>
                  <Button type="button" variant="outline" onClick={() => setShowProfileForm(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

              {/* Tracking Links Card */}
          <Card>
                <CardHeader className="border-b bg-muted/40 px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Tracking Links</CardTitle>
                      <CardDescription>Your product tracking links and their performance</CardDescription>
                </div>
              </div>
            </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-lg border">
              <Table>
                <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-center">Product</TableHead>
                          <TableHead className="text-center">Tracking Link</TableHead>
                          <TableHead className="text-center">Clicks</TableHead>
                          <TableHead className="text-center">Conversions</TableHead>
                          <TableHead className="text-center">Sales</TableHead>
                          <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingLinks?.map((link) => (
                    <TableRow key={link.id}>
                            <TableCell className="text-center font-medium">
                        {link.product
                          ? link.product.name
                          : productMap[link.productId]
                            ? productMap[link.productId].name
                            : 'Unknown Product'}
                      </TableCell>
                            <TableCell className="font-mono text-sm text-center">
                        {link.trackingCode ? `${window.location.origin}/track/${link.trackingCode}` : 'N/A'}
                      </TableCell>
                            <TableCell className="text-center">{link.totalClicks}</TableCell>
                            <TableCell className="text-center">{link.totalConversions}</TableCell>
                            <TableCell className="text-center">
                              ${typeof link.totalSales === 'number' && !isNaN(link.totalSales)
                          ? link.totalSales.toFixed(2)
                          : '0.00'}
                      </TableCell>
                      <TableCell>
                              <div className="flex justify-center">
                                <Button variant="outline" size="sm" onClick={() => handleCopyLink(link.trackingCode)}>
                          Copy Link
                        </Button>
                              </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                  </div>
            </CardContent>
          </Card>

              {/* Product Commissions Card */}
          <Card>
                <CardHeader className="border-b bg-muted/40 px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">Product Commissions</CardTitle>
              <CardDescription>Your commission details for each product</CardDescription>
                    </div>
                  </div>
            </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-center">Product</TableHead>
                          <TableHead className="text-center">Tier</TableHead>
                          <TableHead className="text-center">Tier %</TableHead>
                          <TableHead className="text-center">Product %</TableHead>
                          <TableHead className="text-center">Final %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productCommissions?.map((comm) => (
                      <TableRow key={comm.id}>
                            <TableCell className="text-center font-medium">{comm.productName || 'Unknown'}</TableCell>
                            <TableCell className="text-center">{comm.tierName || 'Unknown'}</TableCell>
                            <TableCell className="text-center">{comm.commissionPercent}%</TableCell>
                            <TableCell className="text-center">{comm.productCommission}%</TableCell>
                            <TableCell className="text-center">{comm.finalCommission}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  </div>
            </CardContent>
          </Card>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
} 