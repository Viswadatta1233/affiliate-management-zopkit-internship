import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Share2, Target, Users, Calendar, ClipboardList, BarChart, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/sonner";
import { CampaignFilters } from "@/components/campaign/campaign-filters";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";
import { NICHE_OPTIONS, AGE_GROUP_OPTIONS } from '@/lib/constants';
import { useNavigate } from 'react-router-dom';

interface CampaignParticipation {
  id: string;
  campaignId: string;
  influencerId: string;
  status: string;
  joinedAt: string;
  completedAt: string | null;
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
  status: string;
  type: string;
  targetAudienceAgeGroup: string;
  requiredInfluencerNiche: string;
  basicGuidelines: string;
  preferredSocialMedia: string;
  marketingObjective: string;
  metrics: {
    totalReach: number;
    engagementRate: number;
    conversions: number;
    revenue: number;
  };
}

export default function InfluencerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, loadUserData } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [participations, setParticipations] = useState<CampaignParticipation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedGuidelines, setExpandedGuidelines] = useState<Record<string, boolean>>({});
  const [expandedObjectives, setExpandedObjectives] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    targetAudienceAgeGroup: "all",
    requiredNiche: "all",
    startDate: null as Date | null,
    endDate: null as Date | null
  });

  const isInfluencer = role?.roleName === 'influencer';
  const isPotentialInfluencer = role?.roleName === 'potential_influencer';

  // Smart role check
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    // Only start checking if user is a potential influencer
    if (isPotentialInfluencer) {
      interval = setInterval(async () => {
        try {
          await loadUserData();
          // If role has changed to influencer, show success message and stop checking
          if (role?.roleName === 'influencer') {
            setSuccessMessage("Your account has been approved! You can now join campaigns.");
            if (interval) {
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error('Error checking role update:', error);
        }
      }, 10000); // Check every 10 seconds
    }

    // Cleanup interval on unmount or when role changes
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPotentialInfluencer, role?.roleName, loadUserData]);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [campaignsResponse, participationsResponse] = await Promise.all([
        api.get('/api/campaigns'),
        api.get('/api/campaigns/participations')
      ]);
      setCampaigns(campaignsResponse.data);
      setParticipations(participationsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch campaigns and participations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCampaign = async (campaignId: string) => {
    try {
      const response = await api.post(`/api/campaigns/${campaignId}/join`, {});
      setParticipations(prev => [...prev, response.data]);
      setSuccessMessage("Successfully joined the campaign!");
      fetchData();
    } catch (error: any) {
      console.error('Error joining campaign:', error);
      setSuccessMessage(error.message || "Failed to join campaign");
    }
  };

  const copyPromotionalLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Promotional link copied to clipboard",
    });
  };

  const toggleGuidelines = (campaignId: string) => {
    setExpandedGuidelines(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };

  const toggleObjectives = (campaignId: string) => {
    setExpandedObjectives(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };

  const formatDate = (date: string | Date) => {
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  const joinedCampaigns = filteredCampaigns.filter(campaign => 
    participations.some(p => p.campaignId === campaign.id)
  );

  const availableCampaigns = filteredCampaigns.filter(campaign => 
    !participations.some(p => p.campaignId === campaign.id)
  );

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
    const isParticipating = participations.some(p => p.campaignId === campaign.id);
    const participation = participations.find(p => p.campaignId === campaign.id);

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{campaign.name}</CardTitle>
              <CardDescription>{campaign.description}</CardDescription>
            </div>
            <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
              {campaign.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Start: {formatDate(campaign.startDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>End: {formatDate(campaign.endDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Target Age: {campaign.targetAudienceAgeGroup}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>Niche: {campaign.requiredInfluencerNiche}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => toggleGuidelines(campaign.id)}
              >
                <span className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Guidelines
                </span>
                <span>{expandedGuidelines[campaign.id] ? '▼' : '▶'}</span>
              </Button>
              {expandedGuidelines[campaign.id] && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  {campaign.basicGuidelines}
                </div>
              )}
            </div>

            <div>
              <Button
                variant="ghost"
                className="w-full justify-between"
                onClick={() => toggleObjectives(campaign.id)}
              >
                <span className="flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  Marketing Objective
                </span>
                <span>{expandedObjectives[campaign.id] ? '▼' : '▶'}</span>
              </Button>
              {expandedObjectives[campaign.id] && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  {campaign.marketingObjective}
                </div>
              )}
            </div>
          </div>

          {isParticipating && participation && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Your Promotional Links</h4>
              {participation.promotionalLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded">
                    {link}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyPromotionalLink(link)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <h4 className="font-medium mt-2">Your Promotional Codes</h4>
              {participation.promotionalCodes.map((code, index) => (
                <div key={index} className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded">
                    {code}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyPromotionalLink(code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {isInfluencer && !isParticipating && (
            <Button
              className="w-full"
              onClick={() => handleJoinCampaign(campaign.id)}
            >
              Join Campaign
            </Button>
          )}
          {isPotentialInfluencer && (
            <Button
              className="w-full"
              variant="outline"
              disabled
            >
              Upgrade to Influencer to Join
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6">
      <Toaster position="bottom-right" />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Influencer Dashboard</h1>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          <span>{successMessage}</span>
        </div>
      )}

      <CampaignFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <Tabs defaultValue="available" className="mt-6">
        <TabsList>
          <TabsTrigger value="available">Available Campaigns</TabsTrigger>
          <TabsTrigger value="my-campaigns">My Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          {isLoading ? (
            <div>Loading campaigns...</div>
          ) : availableCampaigns.length > 0 ? (
            <div className="grid gap-4">
              {availableCampaigns.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No available campaigns match your filters
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-campaigns">
          {isLoading ? (
            <div>Loading your campaigns...</div>
          ) : joinedCampaigns.length > 0 ? (
            <div className="grid gap-4">
              {joinedCampaigns.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              You haven't joined any campaigns yet
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}