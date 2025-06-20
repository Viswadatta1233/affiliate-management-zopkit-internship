import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, Users, Target, Share2, ArrowLeft, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export default function InfluencerCampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuthStore();
  const [campaign, setCampaign] = useState<any>(null);
  const [participation, setParticipation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isInfluencer = role?.roleName === 'influencer';

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const [campaignRes, participationsRes] = await Promise.all([
          api.get(`/api/campaigns/${id}`),
          api.get('/api/campaigns/participations')
        ]);
        setCampaign(campaignRes.data);
        const found = participationsRes.data.find((p: any) => p.campaignId === id);
        setParticipation(found);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load campaign details', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, toast]);

  const handleApply = async () => {
    try {
      await api.post(`/api/campaigns/${id}/join`, {});
      toast({ title: 'Success', description: 'You have successfully joined the campaign!' });
      navigate('/influencer/campaigns');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to join campaign', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Text copied to clipboard' });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-teal-500 border-gray-200"></div>
      </div>
    );
  }
  
  if (!campaign) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Campaign not found</h2>
        <p className="text-gray-600 mt-2">The campaign you're looking for doesn't exist or has been removed.</p>
        <Button 
          variant="outline" 
          className="mt-4 border-teal-500 text-teal-600 hover:bg-teal-50"
          onClick={() => navigate('/influencer/campaigns')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button 
        variant="ghost" 
        className="mb-4 text-teal-600 hover:bg-teal-50 hover:text-teal-700" 
        onClick={() => navigate('/influencer/campaigns')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
      </Button>
      
      <Card>
        <CardHeader className="bg-gradient-to-r from-teal-500 to-teal-400 text-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{campaign.name}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-white text-teal-600">{campaign.status}</Badge>
                <Badge variant="outline" className="text-white border-white">{campaign.type}</Badge>
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              {campaign.commissionRate ? `${campaign.commissionRate}% Commission` : 'N/A'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-500" />
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{new Date(campaign.startDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-teal-500" />
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium">{new Date(campaign.endDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-500" />
              <div>
                <p className="text-sm text-gray-500">Target Age Group</p>
                <p className="font-medium">{campaign.targetAudienceAgeGroup}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-teal-500" />
              <div>
                <p className="text-sm text-gray-500">Required Niche</p>
                <p className="font-medium">{campaign.requiredInfluencerNiche}</p>
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-teal-700 mb-2">Description</h3>
                <p className="text-gray-600">{campaign.description}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-700 mb-2">Marketing Objective</h3>
                <p className="text-gray-600">{campaign.marketingObjective}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-teal-700 mb-2">Basic Guidelines</h3>
                <p className="text-gray-600">{campaign.basicGuidelines}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-700 mb-2">Preferred Platform</h3>
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-teal-500" />
                  <span>{campaign.preferredSocialMedia}</span>
                </div>
              </div>
            </div>
          </div>
          <Separator />
          {participation ? (
            <div>
              <h3 className="text-lg font-semibold text-teal-700 mb-4">Your Participation</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-teal-500 text-teal-600">{participation.status}</Badge>
                  <span>Joined: {new Date(participation.joinedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Promo Codes:</span>
                  {participation.promotionalCodes.map((code: string, idx: number) => (
                    <code key={idx} className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded whitespace-nowrap">{code}</code>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Promo Links:</span>
                  {participation.promotionalLinks.map((link: string, idx: number) => (
                    <code key={idx} className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded whitespace-nowrap">{link}</code>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            isInfluencer && (
              <Button className="w-full bg-teal-500 hover:bg-teal-600" onClick={handleApply}>
                Apply for Campaign
              </Button>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
} 