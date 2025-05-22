import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign } from "lucide-react";
import { Campaign } from '@/types';

interface CampaignMetricsProps {
  campaign: Campaign;
}

export function CampaignMetrics({ campaign }: CampaignMetricsProps) {
  const bonusProgress = campaign.rewards.bonusThreshold
    ? (campaign.metrics.revenue / campaign.rewards.bonusThreshold) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{campaign.name}</CardTitle>
        <CardDescription>Your campaign performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Conversions
              </div>
              <p className="text-2xl font-bold">{campaign.metrics.conversions}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <DollarSign className="w-4 h-4 mr-2" />
                Revenue
              </div>
              <p className="text-2xl font-bold">
                ${campaign.metrics.revenue.toLocaleString()}
              </p>
            </div>
          </div>

          {campaign.rewards.bonusThreshold && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress to Bonus</span>
                <span>{Math.round(bonusProgress)}%</span>
              </div>
              <Progress value={bonusProgress} />
              <p className="text-xs text-muted-foreground">
                ${campaign.metrics.revenue.toLocaleString()} of ${campaign.rewards.bonusThreshold.toLocaleString()} needed for ${campaign.rewards.bonusAmount} bonus
              </p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Engagement Rate</span>
              <span>{campaign.metrics.engagementRate}%</span>
            </div>
            <Progress value={campaign.metrics.engagementRate} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}