import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, Instagram, Mail, Star, Twitter, User, X } from 'lucide-react';

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

export default function AffiliateProfile() {
  const { toast } = useToast();
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
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Fetch affiliate details
  const { data: affiliateDetails, isLoading } = useQuery<AffiliateDetails, Error>({
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

  // Handle profile form submission
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileForm.websiteUrl && !isValidUrl(profileForm.websiteUrl)) {
      setFormError('Please enter a valid website URL.');
      return;
    }
    
    // Validate all social media URLs
    for (const [platform, url] of Object.entries(profileForm.socialMedia)) {
      if (!isValidUrl(url)) {
        setFormError(`Please enter a valid URL for ${platform}.`);
        return;
      }
    }
    
    updateProfileMutation.mutate({
      websiteUrl: profileForm.websiteUrl,
      socialMedia: profileForm.socialMedia,
      promotionalMethods: profileForm.promotionalMethods,
    });
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      await api.put('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
      
      setPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password. Please check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <Card className="overflow-hidden shadow-lg border-gray-200">
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
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : affiliateDetails && !showProfileForm ? (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Referral Code</div>
                    <div className="font-mono text-lg">{affiliateDetails.referralCode || 'N/A'}</div>
                  </div>
                  
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Current Tier</div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-lg">{tierName || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="text-lg">{affiliateEmail || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/20 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Website URL</div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-500" />
                      <span className="text-lg">{affiliateDetails.websiteUrl || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Social Media</h3>
                {Object.keys(affiliateDetails.socialMedia || {}).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(affiliateDetails.socialMedia || {}).map(([platform, url]) => (
                      <div key={platform} className="bg-muted/20 p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground capitalize">{platform}</div>
                        <div className="text-sm truncate">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            {url}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground">N/A</div>
                )}
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Promotional Methods</h3>
                {affiliateDetails.promotionalMethods && affiliateDetails.promotionalMethods.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {affiliateDetails.promotionalMethods.map(method => (
                      <div key={method} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                        {method}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground">N/A</div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-3xl mx-auto">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Website URL</label>
                <Input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={profileForm.websiteUrl}
                  onChange={(e) => setProfileForm(f => ({ ...f, websiteUrl: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Your primary website or blog URL
                </p>
              </div>
              
              <div className="space-y-4">
                <label className="block text-sm font-medium">Social Media Profiles</label>
                
                <div className="flex gap-2">
                  <Select
                    value={profileForm.selectedSocial}
                    onValueChange={(value) => setProfileForm(f => ({ ...f, selectedSocial: value }))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOCIAL_MEDIA_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={profileForm.socialUrl}
                    onChange={(e) => setProfileForm(f => ({ ...f, socialUrl: e.target.value }))}
                    className="flex-1"
                  />
                  
                  <Button type="button" onClick={handleAddSocial}>
                    Add
                  </Button>
                </div>
                
                {Object.keys(profileForm.socialMedia).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(profileForm.socialMedia).map(([platform, url]) => (
                      <div key={platform} className="flex items-center justify-between bg-muted/20 p-2 rounded-md">
                        <div>
                          <span className="font-medium capitalize">{platform}</span>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">{url}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSocial(platform)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <label className="block text-sm font-medium">Promotional Methods</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {PROMO_METHOD_OPTIONS.map(method => (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox
                        id={`promo-${method}`}
                        checked={profileForm.promotionalMethods.includes(method)}
                        onCheckedChange={() => handlePromoToggle(method)}
                      />
                      <label
                        htmlFor={`promo-${method}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {method}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowProfileForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
