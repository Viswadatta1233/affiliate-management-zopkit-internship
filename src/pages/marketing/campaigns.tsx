import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCampaignStore } from '@/store/campaign-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignCard } from '@/components/campaign/campaign-card';
import { CampaignMetrics } from '@/components/campaign/campaign-metrics';
import { useToast } from '@/hooks/use-toast';

export default function MarketingCampaigns() {
  const { user } = useAuthStore();
  const { campaigns, participations, loadCampaigns, loadParticipations, optInToCampaign, error } = useCampaignStore();
  const { toast } = useToast();

  useEffect(() => {
    loadCampaigns();
    loadParticipations();
  }, []);

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

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Campaigns</h1>
          <p className="text-muted-foreground">Browse and participate in brand campaigns</p>
        </div>
      </div>

      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Campaigns</TabsTrigger>
          <TabsTrigger value="active">My Active Campaigns</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaigns
              .filter(campaign => campaign.status === 'active' && !isParticipating(campaign.id))
              .map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onOptIn={handleOptIn}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaigns
              .filter(campaign => isParticipating(campaign.id))
              .map((campaign) => (
                <CampaignMetrics
                  key={campaign.id}
                  campaign={campaign}
                />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Campaign History</CardTitle>
              <CardDescription>View your completed campaign performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns
                  .filter(campaign => campaign.status === 'completed' && isParticipating(campaign.id))
                  .map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Completed on {new Date(campaign.endDate!).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${campaign.metrics.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.metrics.conversions} conversions
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}