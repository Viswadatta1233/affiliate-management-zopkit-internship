import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/axios';

interface ApprovedInfluencer {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  niche: string;
  country: string;
  bio: string;
  socialMedia: {
    instagram?: string;
    youtube?: string;
  };
  status: string;
  createdAt: string;
  metrics: {
    followers: number;
    engagement: number;
    reach: number;
  };
}

export function ApprovedInfluencers() {
  const [influencers, setInfluencers] = useState<ApprovedInfluencer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApprovedInfluencers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/influencers');
      const approvedInfluencers = response.data.filter(
        (inf: ApprovedInfluencer) => inf.status === 'approved'
      );
      setInfluencers(approvedInfluencers);
    } catch (error) {
      console.error('Error fetching approved influencers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch approved influencers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedInfluencers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approved Influencers ({influencers.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {influencers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No approved influencers</p>
          ) : (
            influencers.map((influencer) => (
              <div
                key={influencer.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {influencer.firstName[0]}{influencer.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {influencer.firstName} {influencer.lastName}
                      </h3>
                      <Badge variant="secondary">{influencer.niche}</Badge>
                      <Badge variant="outline">{influencer.country}</Badge>
                      <Badge variant="secondary">Approved</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{influencer.email}</p>
                    <p className="text-sm">{influencer.bio}</p>
                    <div className="flex gap-2">
                      {influencer.socialMedia.instagram && (
                        <Badge variant="outline">Instagram</Badge>
                      )}
                      {influencer.socialMedia.youtube && (
                        <Badge variant="outline">YouTube</Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>Followers: {influencer.metrics.followers}</span>
                      <span>Engagement: {influencer.metrics.engagement}%</span>
                      <span>Reach: {influencer.metrics.reach}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Joined: {new Date(influencer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 