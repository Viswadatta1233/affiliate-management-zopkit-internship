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
  const { data: affiliateDetails } = useQuery<AffiliateDetails>({
    queryKey: ['affiliate-details'],
    queryFn: async () => (await api.get('/api/affiliates/details')).data,
    onSuccess: (data: AffiliateDetails) => {
      setProfileForm(f => ({
        ...f,
        websiteUrl: data.websiteUrl || '',
        socialMedia: data.socialMedia || {},
        promotionalMethods: data.promotionalMethods || [],
      }));
    },
  });

  // Fetch commission tier name if currentTier is present
  const { data: tierName } = useQuery<string>({
    queryKey: ['commission-tier-name', affiliateDetails?.currentTier],
    queryFn: async () => {
      if (!affiliateDetails?.currentTier) return '';
      const res = await api.get(`/api/commissions/tiers`);
      const tier = res.data.find((t: any) => t.id === affiliateDetails.currentTier);
      return tier ? tier.tierName || tier.tier_name : affiliateDetails.currentTier;
    },
    enabled: !!affiliateDetails?.currentTier,
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

  const copyTrackingLink = (code: string) => {
    const link = `${window.location.origin}/track/${code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Tracking link copied!',
      description: 'The tracking link has been copied to your clipboard.',
    });
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
    <div className="min-h-screen flex flex-col items-center justify-start bg-background">
      <div className="w-full max-w-4xl py-8">
        {/* Tenant Card */}
        <Card className="mb-8 shadow-lg border-primary border-2">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">{tenant?.tenantName || 'Affiliate Program'}</CardTitle>
            <CardDescription className="text-muted-foreground">
              Welcome to the affiliate dashboard for <span className="font-semibold">{tenant?.tenantName || 'your program'}</span>.
            </CardDescription>
          </CardHeader>
        </Card>
        {/* Affiliate Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Affiliate Profile</CardTitle>
            <CardDescription>Manage your affiliate details</CardDescription>
          </CardHeader>
          <CardContent>
            {affiliateDetails && !showProfileForm ? (
              <div className="space-y-2">
                <div><b>Referral Code:</b> {affiliateDetails.referralCode}</div>
                <div><b>Current Tier:</b> {tierName || affiliateDetails.currentTier || 'N/A'}</div>
                <div><b>Website URL:</b> {affiliateDetails.websiteUrl || 'N/A'}</div>
                <div><b>Social Media:</b> {Object.entries(affiliateDetails.socialMedia || {}).map(([k, v]) => v ? `${k}: ${v}` : null).filter(Boolean).join(', ') || 'N/A'}</div>
                <div><b>Promotional Methods:</b> {affiliateDetails.promotionalMethods?.join(', ') || 'N/A'}</div>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowProfileForm(true)}>
                  Update Profile
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleProfileSubmit}>
                {formError && <div className="text-red-600 text-sm mb-2">{formError}</div>}
                <div>
                  <label className="block font-medium mb-1">Website URL</label>
                  <input
                    type="url"
                    className="input input-bordered w-full"
                    value={profileForm.websiteUrl}
                    onChange={e => setProfileForm(f => ({ ...f, websiteUrl: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Add Social Media</label>
                  <div className="flex gap-2 items-center mb-2">
                    <Select value={profileForm.selectedSocial} onValueChange={val => setProfileForm(f => ({ ...f, selectedSocial: val }))}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOCIAL_MEDIA_OPTIONS.filter(opt => !profileForm.socialMedia[opt.value]).map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="url"
                      className="input input-bordered flex-1"
                      placeholder="https://social.com/yourprofile"
                      value={profileForm.socialUrl}
                      onChange={e => setProfileForm(f => ({ ...f, socialUrl: e.target.value }))}
                    />
                    <Button type="button" size="sm" onClick={handleAddSocial}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(profileForm.socialMedia).map(([platform, url]) => (
                      <div key={platform} className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
                        <span className="text-xs font-medium">{SOCIAL_MEDIA_OPTIONS.find(opt => opt.value === platform)?.label || platform}:</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs underline text-blue-600">{url}</a>
                        <Button type="button" size="xs" variant="ghost" onClick={() => handleRemoveSocial(platform)}>x</Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-medium mb-1">Promotional Methods</label>
                  <div className="flex flex-wrap gap-3">
                    {PROMO_METHOD_OPTIONS.map(opt => (
                      <label key={opt} className="flex items-center gap-1 text-sm">
                        <Checkbox
                          checked={profileForm.promotionalMethods.includes(opt)}
                          onCheckedChange={() => handlePromoToggle(opt)}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>Save</Button>
                  <Button type="button" variant="outline" onClick={() => setShowProfileForm(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your overall affiliate performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Clicks</h3>
                  <p className="text-2xl font-bold text-primary">
                    {trackingLinks?.reduce((sum, link) => sum + link.totalClicks, 0) || 0}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Conversions</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {trackingLinks?.reduce((sum, link) => sum + link.totalConversions, 0) || 0}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Sales</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ${trackingLinks?.reduce((sum, link) => sum + (typeof link.totalSales === 'number' && !isNaN(link.totalSales) ? link.totalSales : 0), 0).toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracking Links</CardTitle>
              <CardDescription>Your product tracking links and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Tracking Link</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingLinks?.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        {link.product
                          ? link.product.name
                          : productMap[link.productId]
                            ? productMap[link.productId].name
                            : 'Unknown Product'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {link.trackingCode ? `${window.location.origin}/track/${link.trackingCode}` : 'N/A'}
                      </TableCell>
                      <TableCell>{link.totalClicks}</TableCell>
                      <TableCell>{link.totalConversions}</TableCell>
                      <TableCell>
                        {typeof link.totalSales === 'number' && !isNaN(link.totalSales)
                          ? link.totalSales.toFixed(2)
                          : '0.00'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (link.trackingCode) {
                              const linkUrl = `${window.location.origin}/track/${link.trackingCode}`;
                              navigator.clipboard.writeText(linkUrl);
                              toast({
                                title: 'Tracking link copied!',
                                description: 'The tracking link has been copied to your clipboard.',
                              });
                            }
                          }}
                        >
                          Copy Link
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Commissions</CardTitle>
              <CardDescription>Your commission details for each product</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingComms ? (
                <div>Loading product commissions...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Tier %</TableHead>
                      <TableHead>Product %</TableHead>
                      <TableHead>Final %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productCommissions?.map((comm) => (
                      <TableRow key={comm.id}>
                        <TableCell>{comm.productName || 'Unknown'}</TableCell>
                        <TableCell>{comm.tierName || 'Unknown'}</TableCell>
                        <TableCell>{comm.commissionPercent}%</TableCell>
                        <TableCell>{comm.productCommission}%</TableCell>
                        <TableCell>{comm.finalCommission}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 