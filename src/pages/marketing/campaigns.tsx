import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCampaignStore } from '@/store/campaign-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, ArrowRight, Copy, Target, Share2, ClipboardList, Loader2, ExternalLink, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CampaignFilters } from "@/components/campaign/campaign-filters";
import { NICHE_OPTIONS, AGE_GROUP_OPTIONS } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

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
  commissionRate?: number | null;
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
  const { campaigns, participations, loadCampaigns, loadParticipations, error, joinCampaign } = useCampaignStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role?.roleName === 'Tenant Admin' || user?.role?.roleName === 'super-admin';
  const isInfluencer = user?.role?.roleName === 'influencer';
  const isPotentialInfluencer = user?.role?.roleName === 'potential_influencer';
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    targetAudienceAgeGroup: "all",
    requiredNiche: "all",
    dateRange: null as DateRange | null
  });
  const [selectedGuidelines, setSelectedGuidelines] = useState<string>('');
  const [selectedObjectives, setSelectedObjectives] = useState<string>('');
  const [guidelinesModal, setGuidelinesModal] = useState<{ open: boolean, text: string }>({ open: false, text: '' });
  const [objectivesModal, setObjectivesModal] = useState<{ open: boolean, text: string }>({ open: false, text: '' });
  const [detailsModal, setDetailsModal] = useState<{ open: boolean, campaign?: Campaign | null }>({ open: false, campaign: null });

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

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
    const navigate = useNavigate();
    const campaignParticipations = participations.filter(p => p.campaignId === campaign.id);
    const firstParticipation = campaignParticipations[0];

    return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
              <CardTitle className="text-lg">{campaign?.name || 'Untitled Campaign'}</CardTitle>
            <Badge className={getStatusBadgeColor(campaign?.status || 'draft')}>
              {(campaign?.status || 'Draft').charAt(0).toUpperCase() + (campaign?.status || 'draft').slice(1)}
            </Badge>
          </div>
          <Badge variant="outline" className="capitalize">{campaign?.type || 'Unknown'}</Badge>
        </div>
      </CardHeader>
      <CardContent>
          <div className="mb-3 text-lg font-semibold text-primary">
            Commission Rate: {campaign.commissionRate ? `${campaign.commissionRate}%` : 'N/A'}
          </div>
          
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

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Age Group: {campaign?.targetAudienceAgeGroup || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Niche: {campaign?.requiredInfluencerNiche || 'N/A'}</span>
            </div>
          </div>

          {/* Show first joined influencer */}
          {firstParticipation && (
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Joined Influencers</span>
                          <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/marketing/campaigns/${campaign.id}/influencers`)}
                          >
                  View All Influencers
                          </Button>
                        </div>
              <div className="overflow-x-auto">
                <div className="flex gap-4 min-w-max py-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{firstParticipation.influencerName}</span>
                    <Badge variant="outline" className="ml-auto">
                      {firstParticipation.status}
                    </Badge>
                  </div>
                  {firstParticipation.promotionalCodes && firstParticipation.promotionalCodes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Promo Code:</span>
                      {firstParticipation.promotionalCodes.map((code, idx) => (
                        <code key={idx} className="text-xs bg-muted px-1 py-0.5 rounded whitespace-nowrap">{code}</code>
                      ))}
                        </div>
                  )}
                  {firstParticipation.promotionalLinks && firstParticipation.promotionalLinks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Promo Link:</span>
                      {firstParticipation.promotionalLinks.map((link, idx) => (
                        <code key={idx} className="text-xs bg-muted px-1 py-0.5 rounded whitespace-nowrap">{link}</code>
                ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex mt-4">
            <Button
              variant="default"
              className="w-full bg-black text-white hover:bg-gray-900"
              size="lg"
              onClick={() => navigate(`/marketing/campaigns/${campaign.id}`)}
            >
              View Details
            </Button>
          </div>
      </CardContent>
    </Card>
  );
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      targetAudienceAgeGroup: "all",
      requiredNiche: "all",
      dateRange: null
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
        return false;
      }

      // Date range filtering (only if both from and to are set)
      if (filters.dateRange && filters.dateRange.from && filters.dateRange.to) {
        const campaignStartDate = new Date(campaign.startDate);
        const campaignEndDate = new Date(campaign.endDate);
        const filterStart = new Date(filters.dateRange.from);
        const filterEnd = new Date(filters.dateRange.to);
        // Set both dates to start/end of day for accurate comparison
        campaignStartDate.setHours(0, 0, 0, 0);
        campaignEndDate.setHours(23, 59, 59, 999);
        filterStart.setHours(0, 0, 0, 0);
        filterEnd.setHours(23, 59, 59, 999);
        // Only include campaigns that start on/after filterStart AND end on/before filterEnd
        if (campaignStartDate < filterStart || campaignEndDate > filterEnd) {
          return false;
        }
      }

      return true;
    });
  }, [campaigns, filters]);

  const handleJoinCampaign = async (campaignId: string) => {
    try {
      await joinCampaign(campaignId);
      toast({
        title: 'Success',
        description: 'You have successfully joined the campaign!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to join campaign. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        <p>Error loading campaigns: {error}</p>
        <Button onClick={() => loadCampaigns()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // Always show all campaigns for the tenant with filters, no tabs
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
      {filteredCampaigns.length === 0 ? (
            <Card className="p-8 text-center">
          <CardDescription>
            {campaigns.length === 0 
              ? "No campaigns available."
              : "No campaigns match your current filters."}
          </CardDescription>
            </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {filteredCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
            </div>
      )}
      <Dialog open={guidelinesModal.open} onOpenChange={open => setGuidelinesModal(m => ({ ...m, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaign Guidelines</DialogTitle>
          </DialogHeader>
          <div className="mt-4 whitespace-pre-wrap">
            {guidelinesModal.text || 'No guidelines provided.'}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={objectivesModal.open} onOpenChange={open => setObjectivesModal(m => ({ ...m, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Marketing Objectives</DialogTitle>
          </DialogHeader>
          <div className="mt-4 whitespace-pre-wrap">
            {objectivesModal.text || 'No objectives provided.'}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}