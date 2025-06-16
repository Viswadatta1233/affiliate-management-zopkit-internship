import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Users, Target, Share2, ClipboardList, BarChart3, ArrowLeft } from 'lucide-react';
import { Campaign, CampaignParticipation } from '@/types';
import { format } from 'date-fns';
import api from '@/lib/axios';

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [participations, setParticipations] = useState<CampaignParticipation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        const response = await api.get(`/campaigns/${id}`);
        const data = response.data;
        setCampaign(data);
      } catch (error) {
        console.error('Error fetching campaign details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignDetails();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate('/marketing/campaigns')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Campaigns
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{campaign.name}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge className="capitalize">{campaign.status}</Badge>
                <Badge variant="outline" className="capitalize">{campaign.type}</Badge>
              </div>
            </div>
            <div className="text-2xl font-bold text-primary">
              {typeof campaign.commissionRate === 'number' ? `${campaign.commissionRate}% Commission` : 'N/A'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{format(new Date(campaign.startDate), 'PPP')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium">{format(new Date(campaign.endDate), 'PPP')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Target Age Group</p>
                <p className="font-medium">{campaign.targetAudienceAgeGroup}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Required Niche</p>
                <p className="font-medium">{campaign.requiredInfluencerNiche}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Campaign Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{campaign.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Marketing Objective</h3>
                <p className="text-gray-600">{campaign.marketingObjective}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Basic Guidelines</h3>
                <p className="text-gray-600">{campaign.basicGuidelines}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Preferred Platform</h3>
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-gray-500" />
                  <span>{campaign.preferredSocialMedia}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Campaign Metrics */}
          {campaign.metrics && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-500">Total Reach</div>
                    <div className="text-2xl font-bold">{campaign.metrics.totalReach}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-500">Engagement Rate</div>
                    <div className="text-2xl font-bold">{campaign.metrics.engagementRate}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-500">Conversions</div>
                    <div className="text-2xl font-bold">{campaign.metrics.conversions}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-500">Revenue</div>
                    <div className="text-2xl font-bold">${campaign.metrics.revenue}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Participating Influencers */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Participating Influencers</h3>
              <Button
                variant="outline"
                onClick={() => navigate(`/marketing/campaigns/${id}/influencers`)}
              >
                View All Influencers
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {participations.slice(0, 4).map((participation) => (
                <Card key={participation.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{participation.influencerName}</p>
                        <p className="text-sm text-gray-500">
                          Joined: {format(new Date(participation.joinedAt), 'PPP')}
                        </p>
                      </div>
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 