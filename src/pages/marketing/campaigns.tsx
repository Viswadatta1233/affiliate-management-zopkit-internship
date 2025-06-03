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
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-2">{campaign?.name || 'Untitled Campaign'}</CardTitle>
            <Badge className={getStatusBadgeColor(campaign?.status || 'draft')}>
              {(campaign?.status || 'Draft').charAt(0).toUpperCase() + (campaign?.status || 'draft').slice(1)}
            </Badge>
          </div>
          <Badge variant="outline" className="capitalize">
            {campaign?.type || 'Unknown'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{campaign?.description || 'No description available'}</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              Starts: {campaign?.startDate ? formatDate(campaign.startDate) : 'Not set'}
            </span>
          </div>
          {campaign?.endDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Ends: {formatDate(campaign.endDate)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm">
            {campaign?.metrics?.totalReach || 0} Reach
          </span>
        </div>
        {!isParticipating(campaign?.id) ? (
          <Button 
            onClick={() => handleOptIn(campaign.id)}
            className="bg-primary hover:bg-primary/90"
            disabled={!campaign?.id}
          >
            Join Campaign <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline">View Details</Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Campaigns</h1>
          <p className="text-muted-foreground">Browse and participate in brand campaigns</p>
        </div>
       
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="available" className="rounded-md">Available Campaigns</TabsTrigger>
          <TabsTrigger value="active" className="rounded-md">My Active Campaigns</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-md">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            <Card className="p-8 text-center">
              <CardDescription>No available campaigns at the moment.</CardDescription>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns
              .filter(campaign => isParticipating(campaign.id))
              .map((campaign) => (
                <CampaignCardNew key={campaign.id} campaign={campaign} />
              ))}
          </div>
          {campaigns.filter(campaign => isParticipating(campaign.id)).length === 0 && (
            <Card className="p-8 text-center">
              <CardDescription>You haven't joined any campaigns yet.</CardDescription>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns
              .filter(campaign => campaign.status === 'completed' && isParticipating(campaign.id))
              .map((campaign) => (
                <CampaignCardNew key={campaign.id} campaign={campaign} />
              ))}
          </div>
          {campaigns.filter(campaign => campaign.status === 'completed' && isParticipating(campaign.id)).length === 0 && (
            <Card className="p-8 text-center">
              <CardDescription>No completed campaigns yet.</CardDescription>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}