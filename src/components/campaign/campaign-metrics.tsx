import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign } from "lucide-react";
import { Campaign } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";

interface CampaignMetricsProps {
  campaign: Campaign;
  isLoading?: boolean;
  error?: string | null;
}

export function CampaignMetrics({ campaign, isLoading, error }: CampaignMetricsProps) {
  const bonusProgress = campaign.rewards.bonusThreshold
    ? (campaign.metrics.revenue / campaign.rewards.bonusThreshold) * 100
    : 0;

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Error Loading Metrics</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px] mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-[120px]" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-8 w-[120px]" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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