import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCampaignStore } from '@/store/campaign-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function MarketingCampaigns() {
  const { user } = useAuthStore();
  const { campaigns, participations, loadCampaigns, loadParticipations, optInToCampaign, error } = useCampaignStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadCampaigns();
    loadParticipations();
  }, []);

  useEffect(() => {
    // Debug logging
    console.log('All campaigns:', campaigns);
    console.log('Participations:', participations);
  }, [campaigns, participations]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

  const handleOptIn = async (campaignId: string) => {
    try {
      await optInToCampaign(campaignId);
      toast({
        title: "Success",
        description: "Successfully joined the campaign",
      });
    } catch (error) {
      // Error is handled by the store
    }
  };

  const isParticipating = (campaignId: string) => {
    return participations.some(p => p.campaignId === campaignId);
  };

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

  const CampaignCardNew = ({ campaign }: { campaign: any }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200 px-2 py-1 sm:px-4 sm:py-2">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
          <div>
            <CardTitle className="text-lg sm:text-xl mb-1 sm:mb-2 break-words">{campaign?.name || 'Untitled Campaign'}</CardTitle>
            <Badge className={getStatusBadgeColor(campaign?.status || 'draft') + ' mt-1 sm:mt-0'}>
              {(campaign?.status || 'Draft').charAt(0).toUpperCase() + (campaign?.status || 'draft').slice(1)}
            </Badge>
          </div>
          <Badge variant="outline" className="capitalize mt-2 sm:mt-0 w-fit">{campaign?.type || 'Unknown'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-1 pb-2">
        <p className="text-gray-600 mb-2 sm:mb-4 text-sm sm:text-base break-words">{campaign?.description || 'No description available'}</p>
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-4 mb-2 sm:mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-xs sm:text-sm">
              Starts: {campaign?.startDate ? formatDate(campaign.startDate) : 'Not set'}
            </span>
          </div>
          {campaign?.endDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-xs sm:text-sm">
                Ends: {formatDate(campaign.endDate)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-xs sm:text-sm">
            {campaign?.metrics?.totalReach || 0} Reach
          </span>
        </div>
        {!isParticipating(campaign?.id) ? (
          <Button 
            onClick={() => handleOptIn(campaign.id)}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm"
            disabled={!campaign?.id}
          >
            <span className="hidden sm:inline">Join Campaign</span>
            <span className="inline sm:hidden">Join</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" className="w-full sm:w-auto text-sm">View Details</Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto px-2 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Marketing Campaigns</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Browse and participate in brand campaigns</p>
        </div>
      </div>

      <Tabs defaultValue="available" className="space-y-2 sm:space-y-4">
        <TabsList className="bg-muted p-1 rounded-lg w-full sm:w-auto flex flex-wrap gap-2">
          <TabsTrigger value="available" className="rounded-md flex-1 sm:flex-none">Available Campaigns</TabsTrigger>
          <TabsTrigger value="active" className="rounded-md flex-1 sm:flex-none">My Active Campaigns</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-md flex-1 sm:flex-none">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-2 sm:space-y-4">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array.isArray(campaigns) && campaigns
              .filter(campaign => {
                // Debug logging
                console.log('Checking campaign:', campaign);
                return campaign?.status !== 'completed' && !isParticipating(campaign?.id);
              })
              .map((campaign) => (
                <CampaignCardNew key={campaign?.id || Math.random()} campaign={campaign} />
              ))}
          </div>
          {(!Array.isArray(campaigns) || campaigns.filter(campaign => 
            campaign?.status !== 'completed' && !isParticipating(campaign?.id)
          ).length === 0) && (
            <Card className="p-6 sm:p-8 text-center">
              <CardDescription>No available campaigns at the moment.</CardDescription>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-2 sm:space-y-4">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {campaigns
              .filter(campaign => isParticipating(campaign.id))
              .map((campaign) => (
                <CampaignCardNew key={campaign.id} campaign={campaign} />
              ))}
          </div>
          {campaigns.filter(campaign => isParticipating(campaign.id)).length === 0 && (
            <Card className="p-6 sm:p-8 text-center">
              <CardDescription>You haven't joined any campaigns yet.</CardDescription>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {campaigns
              .filter(campaign => campaign.status === 'completed' && isParticipating(campaign.id))
              .map((campaign) => (
                <CampaignCardNew key={campaign.id} campaign={campaign} />
              ))}
          </div>
          {campaigns.filter(campaign => campaign.status === 'completed' && isParticipating(campaign.id)).length === 0 && (
            <Card className="p-6 sm:p-8 text-center">
              <CardDescription>No completed campaigns yet.</CardDescription>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}