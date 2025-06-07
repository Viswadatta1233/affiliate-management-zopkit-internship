import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, Loader2 } from 'lucide-react';
import api from '@/lib/axios';

interface PendingInfluencer {
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
}

export function PendingInfluencers() {
  const [influencers, setInfluencers] = useState<PendingInfluencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPendingInfluencers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/influencers/pending');
      setInfluencers(response.data);
    } catch (error) {
      console.error('Error fetching pending influencers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pending influencers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingInfluencers();
  }, []);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setUpdating(id);
      await api.patch(`/influencers/${id}/status`, { status });
      toast({
        title: 'Success',
        description: `Influencer ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      });
      fetchPendingInfluencers(); // Refresh the list
    } catch (error) {
      console.error('Error updating influencer status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update influencer status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

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
        <CardTitle>Pending Influencers ({influencers.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {influencers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending influencers</p>
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
                    <p className="text-xs text-muted-foreground">
                      Joined: {new Date(influencer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(influencer.id, 'approved')}
                    disabled={updating === influencer.id}
                  >
                    {updating === influencer.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(influencer.id, 'rejected')}
                    disabled={updating === influencer.id}
                  >
                    {updating === influencer.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 