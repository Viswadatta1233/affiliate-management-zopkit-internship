import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Users } from 'lucide-react';
import { CampaignParticipation } from '@/types';
import { format } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import api from '@/lib/axios';

export default function CampaignInfluencers() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [participations, setParticipations] = useState<CampaignParticipation[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaignInfluencers = async () => {
      try {
        const response = await api.get('/campaigns/participations');
        const allParticipations = response.data;
        const filtered = allParticipations.filter((p: any) => p.campaignId === id);
        setParticipations(filtered);
        // Optionally set campaignName if available from another source
      } catch (error) {
        console.error('Error fetching campaign influencers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaignInfluencers();
  }, [id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied to your clipboard.",
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(`/marketing/campaigns/${id}`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Campaign
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Influencers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            {participations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No influencers have joined this campaign yet.</div>
            ) : (
              participations.map((participation) => (
                <Card key={participation.id} className="border border-gray-200">
                  <CardContent className="pt-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <Users className="h-5 w-5 text-gray-500" />
                        <span className="font-semibold text-base">{participation.influencerName}</span>
                        <Badge
                          className={
                            participation.status === 'active'
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : participation.status === 'completed'
                              ? ''
                              : participation.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : ''
                          }
                          variant={
                            participation.status === 'completed'
                              ? 'default'
                              : participation.status === 'active'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {participation.status}
                        </Badge>
                      </div>
                      <div className="flex-1 overflow-x-auto">
                        <div className="flex gap-4 min-w-max py-1">
                          {participation.promotionalCodes && participation.promotionalCodes.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Promo Code:</span>
                              {participation.promotionalCodes.map((code, idx) => (
                                <code key={idx} className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">{code}</code>
                              ))}
                            </div>
                          )}
                          {participation.promotionalLinks && participation.promotionalLinks.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Promo Link:</span>
                              {participation.promotionalLinks.map((link, idx) => (
                                <code key={idx} className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">{link}</code>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 