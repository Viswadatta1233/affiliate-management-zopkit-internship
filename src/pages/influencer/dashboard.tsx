import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { Progress } from '@/components/ui/progress';

interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  type: 'product' | 'service' | 'event';
  metrics: {
    totalReach: number;
    engagementRate: number;
    conversions: number;
    revenue: number;
  };
  tenant: {
    name: string;
    domain: string;
  };
}

interface Participation {
  id: string;
  campaignId: string;
  influencerId: string;
  status: 'pending' | 'approved' | 'rejected';
  metrics: {
    followers: number;
    engagement: number;
    reach: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function InfluencerDashboard() {
  const { user, isLoading: authLoading } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        console.log('Fetching campaigns...');
        const response = await api.get('/campaigns');
        console.log('Campaigns response:', response.data);
        setCampaigns(response.data);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        toast.error('Failed to load campaigns');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchParticipations = async () => {
      try {
        console.log('Fetching participations...');
        const response = await api.get('/campaign-participations');
        console.log('Participations response:', response.data);
        setParticipations(response.data);
      } catch (error) {
        console.error('Error fetching participations:', error);
        toast.error('Failed to load participations');
      }
    };

    if (user) {
      console.log('User authenticated, fetching data...');
      fetchCampaigns();
      fetchParticipations();
    }
  }, [user]);

  const handleParticipate = async (campaignId: string) => {
    try {
      // Get influencer metrics from the user's profile
      const influencerResponse = await api.get('/influencers/me');
      const influencerData = influencerResponse.data;

      await api.post('/campaigns/participations', {
        campaignId,
        metrics: {
          followers: influencerData.metrics.followers || 0,
          engagement: influencerData.metrics.engagement || 0,
          reach: influencerData.metrics.reach || 0
        }
      });
      toast.success('Participation request sent successfully');
      // Refresh participations
      const participationsRes = await api.get('/campaign-participations');
      setParticipations(participationsRes.data);
    } catch (error) {
      console.error('Error participating in campaign:', error);
      toast.error('Failed to participate in campaign');
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getParticipationStatus = (campaignId: string) => {
    const participation = participations.find(p => p.campaignId === campaignId);
    return participation?.status || null;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Influencer Dashboard</h1>
      
      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Campaigns</TabsTrigger>
          <TabsTrigger value="participating">My Participations</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {campaigns.length === 0 ? (
            <p className="text-muted-foreground">No campaigns available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{campaign.name}</CardTitle>
                        <CardDescription>{campaign.tenant.name}</CardDescription>
                      </div>
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{campaign.description}</p>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p>{new Date(campaign.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">End Date</p>
                          <p>{new Date(campaign.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Campaign Type</span>
                          <Badge variant="outline">{campaign.type}</Badge>
                        </div>
                      </div>

                      <Button 
                        className="w-full" 
                        disabled={campaign.status !== 'active'}
                        onClick={() => handleParticipate(campaign.id)}
                      >
                        Participate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="participating" className="space-y-4">
          {participations.length === 0 ? (
            <p className="text-muted-foreground">You haven't participated in any campaigns yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {participations.map((participation) => {
                const campaign = campaigns.find(c => c.id === participation.campaignId);
                if (!campaign) return null;

                return (
                  <Card key={participation.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl">{campaign.name}</CardTitle>
                        <Badge variant={
                          participation.status === 'approved' ? 'default' :
                          participation.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {participation.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{campaign.tenant.name}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{campaign.description}</p>
                      <div className="space-y-2 text-sm">
                        <p><strong>Type:</strong> {campaign.type}</p>
                        <p><strong>Start Date:</strong> {new Date(campaign.startDate).toLocaleDateString()}</p>
                        <p><strong>End Date:</strong> {new Date(campaign.endDate).toLocaleDateString()}</p>
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Your Metrics:</h4>
                          <ul className="list-disc list-inside">
                            <li>Followers: {participation.metrics.followers.toLocaleString()}</li>
                            <li>Engagement: {participation.metrics.engagement}%</li>
                            <li>Reach: {participation.metrics.reach.toLocaleString()}</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 