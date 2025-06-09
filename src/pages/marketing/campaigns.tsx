import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCampaignStore } from '@/store/campaign-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, ArrowRight, Copy, Target, Share2, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampaignFilters } from "@/components/campaign/campaign-filters";
import { NICHE_OPTIONS, AGE_GROUP_OPTIONS } from '@/lib/constants';

interface CampaignParticipation {
  id: string;
  campaignId: string;
  influencerId: string;
  status: string;
  joinedAt: string | Date;
  completedAt: string | Date | null;
  promotionalLinks: string[];
  promotionalCodes: string[];
  influencerName: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  targetAudience?: string;
  budget?: number;
  status: string;
  type?: string;
  participations?: CampaignParticipation[];
  targetAudienceAgeGroup?: string;
  requiredInfluencerNiche?: string;
  preferredSocialMedia?: string;
  marketingObjective?: string;
  basicGuidelines?: string;
  metrics?: {
    totalReach: number;
    engagementRate: number;
    conversions: number;
    revenue: number;
  };
}

export default function MarketingCampaigns() {
  const { user } = useAuthStore();
  const { campaigns, participations, loadCampaigns, loadParticipations, error } = useCampaignStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role?.roleName === 'admin' || user?.role?.roleName === 'super-admin';
  const isInfluencer = user?.role?.roleName === 'influencer';
  const isPotentialInfluencer = user?.role?.roleName === 'potential_influencer';
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    targetAudienceAgeGroup: "all",
    requiredNiche: "all",
    startDate: null as Date | null,
    endDate: null as Date | null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          loadCampaigns(),
          loadParticipations()
        ]);
      } catch (err) {
        console.error('Error loading campaigns:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [loadCampaigns, loadParticipations]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const copyPromotionalLink = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Promotional link copied to clipboard",
    });
  };

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{campaign?.name || 'Untitled Campaign'}</CardTitle>
            <Badge className={getStatusBadgeColor(campaign?.status || 'draft')}>
              {(campaign?.status || 'Draft').charAt(0).toUpperCase() + (campaign?.status || 'draft').slice(1)}
            </Badge>
          </div>
          <Badge variant="outline" className="capitalize">{campaign?.type || 'Unknown'}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{campaign?.description || 'No description available'}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              Starts: {campaign?.startDate ? formatDate(campaign.startDate.toString()) : 'Not set'}
            </span>
          </div>
          {campaign?.endDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Ends: {formatDate(campaign.endDate.toString())}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm">Target Age Group</span>
            </div>
            <span className="text-sm font-medium">{campaign?.targetAudienceAgeGroup}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Target className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm">Required Niche</span>
            </div>
            <span className="text-sm font-medium">{campaign?.requiredInfluencerNiche}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Share2 className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm">Platform</span>
            </div>
            <span className="text-sm font-medium">{campaign?.preferredSocialMedia}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Target className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium">Marketing Objective</span>
            </div>
            <p className="text-sm text-gray-600">{campaign?.marketingObjective}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <ClipboardList className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium">Guidelines</span>
            </div>
            <p className="text-sm text-gray-600">{campaign?.basicGuidelines}</p>
          </div>

          {campaign?.metrics && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Total Reach</p>
                <p className="text-lg font-semibold">{campaign.metrics.totalReach}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Engagement Rate</p>
                <p className="text-lg font-semibold">{campaign.metrics.engagementRate}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Conversions</p>
                <p className="text-lg font-semibold">{campaign.metrics.conversions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-lg font-semibold">${campaign.metrics.revenue}</p>
              </div>
            </div>
          )}
        </div>

        {participations.filter(p => p.campaignId === campaign.id).length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Influencer Participations</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Promotional Links</TableHead>
                  <TableHead>Promotional Codes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participations.filter(p => p.campaignId === campaign.id).map((participation) => (
                  <TableRow key={participation.id}>
                    <TableCell>{participation.influencerName || 'Unknown Influencer'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          participation.status === "completed"
                            ? "default"
                            : participation.status === "active"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {participation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {participation.joinedAt 
                        ? new Date(participation.joinedAt).toLocaleDateString()
                        : ''}
                    </TableCell>
                    <TableCell>
                      {participation.promotionalLinks?.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {link}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyPromotionalLink(link)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {participation.promotionalCodes?.map((code, index) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyPromotionalLink(code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      targetAudienceAgeGroup: "all",
      requiredNiche: "all",
      startDate: null,
      endDate: null
    });
  };

  // Fixed filtering logic
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      // Age group filter
      if (filters.targetAudienceAgeGroup !== "all" && 
          campaign.targetAudienceAgeGroup !== filters.targetAudienceAgeGroup) {
        return false;
      }

      // Niche filter - case insensitive comparison
      if (filters.requiredNiche !== "all" && 
          campaign.requiredInfluencerNiche.toLowerCase() !== filters.requiredNiche.toLowerCase()) {
        console.log('Niche filter:', {
          campaignNiche: campaign.requiredInfluencerNiche,
          filterNiche: filters.requiredNiche,
          normalizedCampaignNiche: campaign.requiredInfluencerNiche.toLowerCase(),
          normalizedFilterNiche: filters.requiredNiche.toLowerCase()
        });
        return false;
      }

      // Date range filtering
      if (filters.startDate || filters.endDate) {
        const campaignStartDate = new Date(campaign.startDate);
        const campaignEndDate = new Date(campaign.endDate);

        // Start date filter
        if (filters.startDate) {
          const filterStartDate = new Date(filters.startDate);
          // Set both dates to start of day for accurate comparison
          campaignStartDate.setHours(0, 0, 0, 0);
          filterStartDate.setHours(0, 0, 0, 0);
          
          console.log('Start date filter:', {
            campaignStart: campaignStartDate,
            filterStart: filterStartDate
          });

          if (campaignStartDate < filterStartDate) {
            return false;
          }
        }

        // End date filter
        if (filters.endDate) {
          const filterEndDate = new Date(filters.endDate);
          // Set both dates to end of day for accurate comparison
          campaignEndDate.setHours(23, 59, 59, 999);
          filterEndDate.setHours(23, 59, 59, 999);
          
          console.log('End date filter:', {
            campaignEnd: campaignEndDate,
            filterEnd: filterEndDate
          });

          if (campaignEndDate > filterEndDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [campaigns, filters]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <Button onClick={() => navigate('/marketing/campaigns/create')}>
          Create Campaign
        </Button>
      </div>

      <CampaignFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Campaigns</TabsTrigger>
          {!isAdmin && <TabsTrigger value="participating">My Campaigns</TabsTrigger>}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
          {filteredCampaigns.length === 0 && (
            <Card className="p-8 text-center">
              <CardDescription>
                {campaigns.length === 0 
                  ? "No campaigns available."
                  : "No campaigns match your current filters."}
              </CardDescription>
            </Card>
          )}
        </TabsContent>

        {!isAdmin && (
          <TabsContent value="participating" className="space-y-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredCampaigns
                .filter(campaign => participations.some(p => p.campaignId === campaign.id))
                .map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
            </div>
            {filteredCampaigns.filter(campaign => participations.some(p => p.campaignId === campaign.id)).length === 0 && (
              <Card className="p-8 text-center">
                <CardDescription>
                  {campaigns.filter(campaign => participations.some(p => p.campaignId === campaign.id)).length === 0
                    ? "You haven't joined any campaigns yet."
                    : "No campaigns match your current filters."}
                </CardDescription>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}