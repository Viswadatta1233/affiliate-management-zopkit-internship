import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Users, AlertCircle } from "lucide-react";
import { Campaign } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';

interface CampaignCardProps {
  campaign: Campaign;
  onOptIn: (campaignId: string) => Promise<void>;
  isParticipating?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

export function CampaignCard({ campaign, onOptIn, isParticipating, isLoading, error }: CampaignCardProps) {
  const [isOptingIn, setIsOptingIn] = React.useState(false);

  const handleOptIn = async () => {
    try {
      setIsOptingIn(true);
      await onOptIn(campaign.id);
      toast.success('Successfully joined campaign');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join campaign');
    } finally {
      setIsOptingIn(false);
    }
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <CardTitle>Error</CardTitle>
          </div>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-[80px]" />
            <Skeleton className="h-5 w-[80px]" />
          </div>
          <Skeleton className="h-6 w-[200px] mt-2" />
          <Skeleton className="h-4 w-[300px] mt-2" />
        </CardHeader>
        <CardContent className="flex-1">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[60px]" />
            </div>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <Skeleton className="h-9 w-full mt-4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const campaignProgress = Math.round(
    (new Date().getTime() - new Date(campaign.startDate).getTime()) /
    (new Date(campaign.endDate || '').getTime() - new Date(campaign.startDate).getTime()) * 100
  );

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
            {campaign.status}
          </Badge>
          <Badge variant="outline">{campaign.type}</Badge>
        </div>
        <CardTitle className="mt-2">{campaign.name}</CardTitle>
        <CardDescription>{campaign.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>Commission Rate</span>
            </div>
            <span className="font-medium">{campaign.rewards.commissionRate}%</span>
          </div>

          {campaign.rewards.bonusThreshold && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Bonus</span>
              </div>
              <span className="font-medium">
                ${campaign.rewards.bonusAmount} at ${campaign.rewards.bonusThreshold}
              </span>
            </div>
          )}

          {campaign.requirements.minFollowers && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Min. Followers</span>
              </div>
              <span className="font-medium">{campaign.requirements.minFollowers}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Campaign Progress</span>
              <span>{campaignProgress}%</span>
            </div>
            <Progress value={campaignProgress} />
          </div>

          <div className="pt-4">
            <Button 
              className="w-full" 
              onClick={handleOptIn}
              disabled={isParticipating || isOptingIn || campaign.status !== 'active'}
              loading={isOptingIn}
            >
              {isParticipating ? 'Participating' : isOptingIn ? 'Joining...' : 'Participate'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}