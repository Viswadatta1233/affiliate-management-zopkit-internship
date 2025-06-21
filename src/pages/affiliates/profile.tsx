import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  Mail, 
  Globe, 
  Star, 
  Copy, 
  CheckCircle2, 
  ExternalLink,
  Award,
  TrendingUp, 
  DollarSign,
  Users,
  Link2,
  Calendar,
  MapPin,
  Phone,
  Facebook,
  Twitter, 
  Instagram,
  Linkedin,
  Youtube,
  Video,
  BarChart3,
  Activity,
  Target,
  Zap
} from 'lucide-react';

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
  firstName?: string;
  lastName?: string;
  createdAt?: string;
  status?: string;
}

const getSocialIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'facebook': return <Facebook className="h-4 w-4" />;
    case 'twitter': return <Twitter className="h-4 w-4" />;
    case 'instagram': return <Instagram className="h-4 w-4" />;
    case 'linkedin': return <Linkedin className="h-4 w-4" />;
    case 'youtube': return <Youtube className="h-4 w-4" />;
    case 'tiktok': return <Video className="h-4 w-4" />;
    default: return <Globe className="h-4 w-4" />;
  }
};

const getTierColor = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case 'bronze': return 'bg-amber-500';
    case 'silver': return 'bg-gray-400';
    case 'gold': return 'bg-yellow-500';
    case 'platinum': return 'bg-purple-500';
    case 'diamond': return 'bg-blue-500';
    default: return 'bg-gray-500';
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function AffiliateProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  // Fetch affiliate details
  const { data: affiliateDetails, isLoading, error } = useQuery<AffiliateDetails>({
    queryKey: ['affiliate-profile', id],
    queryFn: async () => {
      if (!id) throw new Error('No affiliate ID provided');
      const response = await api.get(`/api/affiliates/details?userId=${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch commission tier name
  const { data: tierName } = useQuery<string>({
    queryKey: ['commission-tier-name', affiliateDetails?.currentTier],
    queryFn: async () => {
      if (!affiliateDetails?.currentTier) return '';
      const res = await api.get(`/api/commissions/tiers`);
      const tier = res.data.find((t: any) => t.id === affiliateDetails.currentTier);
      return tier ? tier.tierName || tier.tier_name : affiliateDetails.currentTier;
    },
    enabled: !!affiliateDetails?.currentTier
  });

  // Fetch affiliate performance stats (mock data for now)
  const { data: performanceStats } = useQuery({
    queryKey: ['affiliate-performance', id],
    queryFn: async () => {
      // Mock data - replace with actual API call
      return {
        totalSales: 125000,
        totalCommissions: 18750,
        activeLinks: 8,
        conversionRate: 3.2,
        clickCount: 8900,
        avgOrderValue: 156,
        monthlyGrowth: 12.5,
        totalReferrals: 45
      };
    },
    enabled: !!id,
  });

  const copyReferralCode = async () => {
    if (affiliateDetails?.referralCode) {
      await navigator.clipboard.writeText(affiliateDetails.referralCode);
      setCopied(true);
      toast({
        title: "Referral code copied!",
        description: "The referral code has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Replace fallback logic:
  const affiliateName = `${affiliateDetails?.firstName || ''} ${affiliateDetails?.lastName || ''}`.trim() || 'Unknown Affiliate';
  const affiliateEmail = affiliateDetails?.email || '';

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (error || !affiliateDetails) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Affiliate Not Found</h2>
          <p className="text-gray-600 mb-4">The affiliate profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/affiliates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Affiliates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/affiliates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Affiliates
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Affiliate Profile</h1>
            <p className="text-muted-foreground">Detailed information about {affiliateName}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Overview */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-gray-700 text-white pb-12 relative">
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="relative z-10">
                <CardTitle className="text-xl">Profile Overview</CardTitle>
              </div>
            </CardHeader>
            <div className="relative">
              <div className="absolute -top-10 inset-x-0 flex justify-center">
                <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                  <AvatarImage src="" alt={affiliateName} />
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-2xl">
                    {(affiliateName || 'A')[0]}
                  </AvatarFallback>
              </Avatar>
              </div>
            </div>
            
            <CardContent className="pt-12 pb-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1">{affiliateName}</h3>
                <p className="text-gray-500 mb-4">{affiliateEmail}</p>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge variant={affiliateDetails?.status === 'active' ? 'default' : 'secondary'}>
                    {affiliateDetails?.status || 'Active'}
                  </Badge>
                  <Badge variant="outline" className={`${getTierColor(tierName || '')} text-white border-0`}>
                    <Award className="mr-1 h-3 w-3" />
                    {tierName || 'N/A'}
                  </Badge>
                </div>
                  </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium">{affiliateEmail}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-sm text-gray-500">Joined</div>
                    <div className="font-medium">{formatDate(affiliateDetails?.createdAt || '')}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-purple-500" />
                  <div>
                    <div className="text-sm text-gray-500">Website</div>
                    <div className="font-medium">
                      {affiliateDetails?.websiteUrl ? (
                        <a 
                          href={affiliateDetails.websiteUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Visit Site
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Copy className="h-4 w-4 text-orange-500" />
                  <div>
                    <div className="text-sm text-gray-500">Referral Code</div>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {affiliateDetails?.referralCode || 'N/A'}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyReferralCode}
                        className="h-6 w-6 p-0"
                      >
                        {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="promotion">Promotion</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Performance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="shadow-md border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Total Sales</div>
                        <div className="text-xl font-bold">${performanceStats?.totalSales?.toLocaleString() || '0'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Commissions</div>
                        <div className="text-xl font-bold">${performanceStats?.totalCommissions?.toLocaleString() || '0'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Link2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Active Links</div>
                        <div className="text-xl font-bold">{performanceStats?.activeLinks || '0'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Target className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Conversion Rate</div>
                        <div className="text-xl font-bold">{performanceStats?.conversionRate || '0'}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
          </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-md border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <Activity className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Total Clicks</div>
                        <div className="text-lg font-bold">{performanceStats?.clickCount?.toLocaleString() || '0'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Avg Order Value</div>
                        <div className="text-lg font-bold">${performanceStats?.avgOrderValue || '0'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <Users className="h-5 w-5 text-pink-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Total Referrals</div>
                        <div className="text-lg font-bold">{performanceStats?.totalReferrals || '0'}</div>
                      </div>
                </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-500" />
                    Social Media Accounts
                  </CardTitle>
                  <CardDescription>Connected social media platforms and handles</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(affiliateDetails.socialMedia || {}).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(affiliateDetails.socialMedia || {}).map(([platform, url]) => (
                        <div key={platform} className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getSocialIcon(platform)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium capitalize">{platform}</div>
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                            >
                              {url}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                        <Users className="h-6 w-6 text-gray-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-1">No social media accounts</h3>
                      <p className="text-gray-500">This affiliate hasn't connected any social media accounts yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promotion" className="space-y-6">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    Promotional Methods
                  </CardTitle>
                  <CardDescription>How this affiliate promotes products and services</CardDescription>
                </CardHeader>
                <CardContent>
                  {affiliateDetails.promotionalMethods && affiliateDetails.promotionalMethods.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {affiliateDetails.promotionalMethods.map(method => (
                        <Badge key={method} variant="secondary" className="px-3 py-1 text-sm">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                        <Target className="h-6 w-6 text-gray-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-1">No promotional methods</h3>
                      <p className="text-gray-500">This affiliate hasn't specified their promotional methods yet.</p>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card className="shadow-md border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    Performance Analytics
                  </CardTitle>
                  <CardDescription>Detailed performance metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Monthly Growth</h4>
                        <div className="text-2xl font-bold text-green-600">
                          +{performanceStats?.monthlyGrowth || '0'}%
                        </div>
                        <p className="text-sm text-gray-500">Compared to last month</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Conversion Rate</h4>
                        <div className="text-2xl font-bold text-blue-600">
                          {performanceStats?.conversionRate || '0'}%
                        </div>
                        <p className="text-sm text-gray-500">Click to purchase ratio</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-medium mb-3">Recent Activity</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-1 bg-green-100 rounded">
                              <DollarSign className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium">New Sale</div>
                              <div className="text-sm text-gray-500">Premium Package - $750</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">2 hours ago</div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-1 bg-blue-100 rounded">
                              <Link2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">Link Click</div>
                              <div className="text-sm text-gray-500">Summer Sale Campaign</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">1 day ago</div>
                        </div>
                      </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}