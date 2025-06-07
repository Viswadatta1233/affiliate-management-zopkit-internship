import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCampaignStore } from '@/store/campaign-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, ArrowRight, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CampaignParticipation {
  id: string;
  campaignId: string;
  influencerId: string;
  status: string;
  joinedAt: string | Date;
  completedAt: string | Date | null;
  promotionalLinks: string[];
  promotionalCodes: string[];
  influencerName: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  targetAudience?: string;
  budget?: number;
  status: string;
  type?: string;
  participations?: CampaignParticipation[];
}

export default function MarketingCampaigns() {
  const { user } = useAuthStore();
  const { campaigns, participations, loadCampaigns, loadParticipations, error } = useCampaignStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role?.roleName === 'admin' || user?.role?.roleName === 'super-admin';
  const isInfluencer = user?.role?.roleName === 'influencer';
  const isPotentialInfluencer = user?.role?.roleName === 'potential_influencer';
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          loadCampaigns(),
          loadParticipations()
        ]);
      } catch (err) {
        console.error('Error loading campaigns:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [loadCampaigns, loadParticipations]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

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

  const copyPromotionalLink = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Promotional link copied to clipboard",
    });
  };

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{campaign?.name || 'Untitled Campaign'}</CardTitle>
            <Badge className={getStatusBadgeColor(campaign?.status || 'draft')}>
              {(campaign?.status || 'Draft').charAt(0).toUpperCase() + (campaign?.status || 'draft').slice(1)}
            </Badge>
          </div>
          <Badge variant="outline" className="capitalize">{campaign?.type || 'Unknown'}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{campaign?.description || 'No description available'}</p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              Starts: {campaign?.startDate ? formatDate(campaign.startDate.toString()) : 'Not set'}
            </span>
          </div>
          {campaign?.endDate && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                Ends: {formatDate(campaign.endDate.toString())}
              </span>
            </div>
          )}
        </div>
        {participations.filter(p => p.campaignId === campaign.id).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Influencer Participations</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Promotional Links</TableHead>
                  <TableHead>Promotional Codes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participations.filter(p => p.campaignId === campaign.id).map((participation: CampaignParticipation) => (
                  <TableRow key={participation.id}>
                    <TableCell>{participation.influencerName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          participation.status === "completed"
                            ? "default"
                            : participation.status === "in_progress"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {participation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {typeof participation.joinedAt === 'string' ? participation.joinedAt.split('T')[0] : participation.joinedAt instanceof Date ? participation.joinedAt.toLocaleDateString() : ''}
                    </TableCell>
                    <TableCell>
                      {participation.promotionalLinks?.map((link: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {link}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyPromotionalLink(link)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      {participation.promotionalCodes?.map((code: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-1">
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyPromotionalLink(code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Campaigns</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Manage your marketing campaigns' : 'Browse available campaigns'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate('/marketing/campaigns/new')}>
            Create Campaign
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Campaigns</TabsTrigger>
          {!isAdmin && <TabsTrigger value="participating">My Campaigns</TabsTrigger>}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
          {campaigns.length === 0 && (
            <Card className="p-8 text-center">
              <CardDescription>No campaigns available.</CardDescription>
            </Card>
          )}
        </TabsContent>

        {!isAdmin && (
          <TabsContent value="participating" className="space-y-4">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {campaigns
                .filter(campaign => participations.some(p => p.campaignId === campaign.id))
                .map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
            </div>
            {campaigns.filter(campaign => participations.some(p => p.campaignId === campaign.id)).length === 0 && (
              <Card className="p-8 text-center">
                <CardDescription>You haven't joined any campaigns yet.</CardDescription>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}