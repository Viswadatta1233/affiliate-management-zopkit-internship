import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Users } from "lucide-react";
import { Campaign } from '@/types';

interface CampaignCardProps {
  campaign: Campaign;
  onOptIn: (campaignId: string) => void;
  isParticipating?: boolean;
}

export function CampaignCard({ campaign, onOptIn, isParticipating }: CampaignCardProps) {
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
              <span>
                {Math.round((new Date().getTime() - new Date(campaign.startDate).getTime()) / 
                (new Date(campaign.endDate || '').getTime() - new Date(campaign.startDate).getTime()) * 100)}%
              </span>
            </div>
            <Progress value={45} />
          </div>

          <div className="pt-4">
            <Button 
              className="w-full" 
              onClick={() => onOptIn(campaign.id)}
              disabled={isParticipating}
            >
              {isParticipating ? 'Participating' : 'Participate'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}