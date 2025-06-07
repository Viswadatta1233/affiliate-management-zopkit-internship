import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCampaignStore } from '@/store/campaign-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Copy } from 'lucide-react';

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

export default function InfluencerDashboard() {
  const { user, role } = useAuthStore();
  const { campaigns, participations, loadCampaigns, loadParticipations, joinCampaign, error } = useCampaignStore();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isApprovedInfluencer = role?.roleName === 'influencer';

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Loading campaigns and participations...');
        await loadCampaigns();
        await loadParticipations();
        console.log('Campaigns loaded:', campaigns);
        console.log('Participations loaded:', participations);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleJoinCampaign = async (campaignId: string) => {
    try {
      console.log('Joining campaign:', campaignId);
      await joinCampaign(campaignId);
      toast.success('Successfully joined the campaign');
    } catch (error) {
      console.error('Error joining campaign:', error);
      // Error is handled by the store
    }
  };

  const copyPromotionalLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Promotional link copied to clipboard');
  };

  const CampaignCard = ({ campaign }: { campaign: any }) => {
    const participation = participations.find(p => p.campaignId === campaign.id);
    const isParticipating = !!participation;
    const isActive = campaign.status === 'active';

    // Debug log for join button condition
    console.log('Campaign:', campaign.name, 'isActive:', isActive, 'isApprovedInfluencer:', isApprovedInfluencer, 'isParticipating:', isParticipating);

    return (
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{campaign.name}</CardTitle>
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {campaign.status}
              </Badge>
            </div>
            <Badge variant="outline" className="capitalize">{campaign.type}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{campaign.description}</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p>{new Date(campaign.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p>{campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'No end date'}</p>
            </div>
          </div>

          {isParticipating ? (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              {participation.promotionalLinks && participation.promotionalLinks.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Your Promotional Links</p>
                  {participation.promotionalLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-background px-2 py-1 rounded flex-1 overflow-x-auto">
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
                </div>
              )}
              {participation.promotionalCodes && participation.promotionalCodes.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Your Promotional Codes</p>
                  {participation.promotionalCodes.map((code, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-background px-2 py-1 rounded flex-1 overflow-x-auto">
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
            </div>
          ) : isActive && isApprovedInfluencer && (
            <Button 
              className="w-full mt-4"
              onClick={() => handleJoinCampaign(campaign.id)}
            >
              Join Campaign
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const availableCampaigns = campaigns.filter(campaign => !participations.some(p => p.campaignId === campaign.id));
  const participatingCampaigns = campaigns.filter(campaign => participations.some(p => p.campaignId === campaign.id));

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Influencer Dashboard</h1>
      
      <Tabs defaultValue="available" className="space-y-4">
        <TabsList>
          <TabsTrigger value="available">Available Campaigns ({availableCampaigns.length})</TabsTrigger>
          <TabsTrigger value="participating">My Campaigns ({participatingCampaigns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {availableCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
          {availableCampaigns.length === 0 && (
            <Card className="p-8 text-center">
              <CardDescription>No available campaigns at the moment.</CardDescription>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participating" className="space-y-4">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {participatingCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
          {participatingCampaigns.length === 0 && (
            <Card className="p-8 text-center">
              <CardDescription>You haven't joined any campaigns yet.</CardDescription>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}