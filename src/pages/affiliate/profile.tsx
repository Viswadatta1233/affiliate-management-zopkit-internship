import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Globe, 
  Instagram, 
  Mail, 
  Star, 
  Twitter, 
  User, 
  X, 
  Facebook, 
  Linkedin, 
  Youtube, 
  Video, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  Award,
  Edit3
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
  const navigate = useNavigate();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileForm, setProfileForm] = useState({
    websiteUrl: '',
    socialMedia: {} as Record<string, string>,
    promotionalMethods: [] as string[],
    selectedSocial: '',
    socialUrl: '',
  });
  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState(false);

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
  const user = useAuthStore((state) => state.user);

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

  // Copy referral code to clipboard
  const copyReferralCode = () => {
    if (affiliateDetails?.referralCode) {
      navigator.clipboard.writeText(affiliateDetails.referralCode);
      setCopied(true);
      toast({ 
        title: "Copied to clipboard",
        description: "Referral code has been copied to your clipboard"
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get tier color based on tier name
  const getTierColor = (tier: string = '') => {
    const tierLower = tier.toLowerCase();
    if (tierLower.includes('diamond')) return 'bg-blue-500';
    if (tierLower.includes('gold')) return 'bg-yellow-500';
    if (tierLower.includes('silver')) return 'bg-gray-400';
    if (tierLower.includes('bronze')) return 'bg-amber-700';
    if (tierLower.includes('platinum')) return 'bg-purple-500';
    return 'bg-teal-500';
  };

  // Get social media icon
  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram': return <Instagram className="h-5 w-5" />;
      case 'twitter': return <Twitter className="h-5 w-5" />;
      case 'facebook': return <Facebook className="h-5 w-5" />;
      case 'linkedin': return <Linkedin className="h-5 w-5" />;
      case 'youtube': return <Youtube className="h-5 w-5" />;
      case 'tiktok': return <Video className="h-5 w-5" />;
      default: return <ExternalLink className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-teal-500 to-teal-400 px-8 py-4 rounded-r-full -ml-6 shadow-lg">
          Your Profile
        </h1>
            {!showProfileForm && (
          <Button 
            variant="outline" 
            className="rounded-full px-6 shadow-sm border-teal-500 text-teal-600 hover:bg-teal-50"
            onClick={() => setShowProfileForm(true)}
          >
            <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                      </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Overview */}
                      <div>
            <Card className="shadow-md border-0 overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-400 text-white pb-12 relative">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0 bg-black opacity-10"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                <div className="relative z-10">
                  <CardTitle className="text-xl">Affiliate Details</CardTitle>
                      </div>
              </CardHeader>
              <div className="relative">
                <div className="absolute -top-10 inset-x-0 flex justify-center">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                    <AvatarImage src={user?.avatarUrl || ""} alt={user?.firstName || "User"} />
                    <AvatarFallback className="bg-teal-100 text-teal-800 text-2xl">
                      {user?.firstName?.[0] || "A"}
                    </AvatarFallback>
                  </Avatar>
                      </div>
              </div>
              <CardContent className="pt-12 pb-6 text-center">
                <h3 className="text-xl font-semibold mb-1">{user?.firstName} {user?.lastName}</h3>
                <p className="text-gray-500 mb-6">{affiliateEmail}</p>

                <div className="space-y-6 mt-6">
                  <div className="flex flex-col items-center">
                    <div className="text-sm text-gray-500 mb-1">Current Tier</div>
                    <div className={`${getTierColor(tierName)} text-white px-4 py-2 rounded-full font-medium flex items-center gap-1 shadow-md`}>
                      <Award className="h-4 w-4" />
                      <span className="capitalize">{tierName || 'N/A'}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 mb-1">Referral Code</div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="bg-gray-100 px-4 py-2 rounded-lg font-mono text-teal-700 border border-gray-200">
                        {affiliateDetails?.referralCode || 'N/A'}
                </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-teal-500 text-teal-600 hover:bg-teal-50"
                        onClick={copyReferralCode}
                      >
                        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  {affiliateDetails?.websiteUrl && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Website</div>
                      <a 
                        href={affiliateDetails.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:underline flex items-center justify-center gap-1"
                      >
                        <Globe className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">
                          {affiliateDetails.websiteUrl.replace(/^https?:\/\//i, '')}
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 py-4 flex justify-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/affiliate/change-password')}
                  className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                >
                  Change Password
                </Button>
              </CardFooter>
            </Card>
              </div>
              
          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            {!showProfileForm ? (
              <div className="space-y-6">
                {/* Social Media */}
                <Card className="shadow-md border-0 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-400 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Social Media</CardTitle>
                        <CardDescription className="text-white/80">Your connected social accounts</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {Object.keys(affiliateDetails?.socialMedia || {}).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(affiliateDetails?.socialMedia || {}).map(([platform, url]) => (
                          <div key={platform} className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                            <div className={`p-2 rounded-full bg-${platform.toLowerCase()}-100`}>
                              {getSocialIcon(platform)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium capitalize">{platform}</div>
                              <a 
                                href={url as string} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm text-teal-600 hover:underline truncate block"
                              >
                                {url as string}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-1">No social media accounts</h3>
                        <p className="text-gray-500 mb-4">Connect your social media accounts to enhance your profile</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-teal-500 text-teal-600 hover:bg-teal-50"
                          onClick={() => setShowProfileForm(true)}
                        >
                          Connect Accounts
                        </Button>
                      </div>
                )}
                  </CardContent>
                </Card>

                {/* Promotional Methods */}
                <Card className="shadow-md border-0 overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-400 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Promotional Methods</CardTitle>
                        <CardDescription className="text-white/80">How you promote affiliate products</CardDescription>
                      </div>
              </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {affiliateDetails?.promotionalMethods?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {affiliateDetails.promotionalMethods.map(method => (
                          <Badge key={method} variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-full">
                        {method}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                          <Star className="h-6 w-6 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-700 mb-1">No promotional methods</h3>
                        <p className="text-gray-500 mb-4">Select how you plan to promote affiliate products</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-teal-500 text-teal-600 hover:bg-teal-50"
                          onClick={() => setShowProfileForm(true)}
                        >
                          Add Methods
                        </Button>
                  </div>
                )}
                  </CardContent>
                </Card>
            </div>
          ) : (
              <Card className="shadow-md border-0 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-400 text-white">
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription className="text-white/80">Update your affiliate profile information</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
              {formError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                  {formError}
                </div>
              )}
              
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-teal-700">Basic Information</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700">
                            Website URL
                          </label>
                <Input
                            id="websiteUrl"
                            value={profileForm.websiteUrl}
                            onChange={(e) => setProfileForm({...profileForm, websiteUrl: e.target.value})}
                  placeholder="https://yourwebsite.com"
                            className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                />
                        </div>
                      </div>
              </div>
                    
                    <Separator className="bg-teal-200" />
              
              <div className="space-y-4">
                      <h3 className="text-lg font-medium text-teal-700">Social Media</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(profileForm.socialMedia).map(([platform, url]) => (
                          <div key={platform} className="flex items-center gap-2">
                            <div className="w-10 flex justify-center">
                              {getSocialIcon(platform)}
                            </div>
                            <Input
                              value={url as string}
                              onChange={(e) => setProfileForm({
                                ...profileForm,
                                socialMedia: {...profileForm.socialMedia, [platform]: e.target.value}
                              })}
                              className="flex-1 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveSocial(platform)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                
                        <div className="flex gap-2 mt-2">
                  <Select
                    value={profileForm.selectedSocial}
                            onValueChange={(value) => setProfileForm({...profileForm, selectedSocial: value})}
                  >
                            <SelectTrigger className="w-[180px] border-gray-300 focus:border-teal-500 focus:ring-teal-500">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                              {SOCIAL_MEDIA_OPTIONS
                                .filter(option => !Object.keys(profileForm.socialMedia).includes(option.value))
                                .map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                                ))
                              }
                    </SelectContent>
                  </Select>
                  <Input
                    value={profileForm.socialUrl}
                            onChange={(e) => setProfileForm({...profileForm, socialUrl: e.target.value})}
                            placeholder="https://platform.com/username"
                            className="flex-1 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                          <Button
                            type="button"
                            onClick={handleAddSocial}
                            disabled={!profileForm.selectedSocial || !profileForm.socialUrl}
                            className="bg-teal-500 hover:bg-teal-600 text-white"
                          >
                    Add
                  </Button>
                        </div>
                      </div>
              </div>
                    
                    <Separator className="bg-teal-200" />
              
              <div className="space-y-4">
                      <h3 className="text-lg font-medium text-teal-700">Promotional Methods</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {PROMO_METHOD_OPTIONS.map(method => (
                          <label key={method} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                      <Checkbox
                        checked={profileForm.promotionalMethods.includes(method)}
                        onCheckedChange={() => handlePromoToggle(method)}
                              className="border-gray-300 data-[state=checked]:bg-teal-500 data-[state=checked]:border-teal-500"
                            />
                            <span>{method}</span>
                      </label>
                  ))}
                </div>
              </div>
              
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowProfileForm(false)}
                        className="border-gray-300"
                      >
                  Cancel
                </Button>
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        className="bg-teal-500 hover:bg-teal-600 text-white"
                      >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
        </CardContent>
      </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
