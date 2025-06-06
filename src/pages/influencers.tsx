import { useEffect, useState, useCallback } from 'react';
import { InfluencerList } from '@/components/influencer/InfluencerList';
import { PageHeader } from '@/components/layout/PageHeader';
import { useToast } from '@/components/ui/use-toast';

interface Influencer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  niche: string;
  country: string;
  status: string;
  followers: string;
  engagement: string;
}

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInfluencers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/influencers');
      if (!response.ok) {
        throw new Error('Failed to fetch influencers');
      }
      const data = await response.json();
      setInfluencers(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load influencers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInfluencers();
  }, [fetchInfluencers]);

  return (
    <div className="container mx-auto p-6">
      <PageHeader
        title="Influencers"
        description="Manage your influencer network and track their performance"
      />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <InfluencerList
          influencers={influencers}
          onRefresh={fetchInfluencers}
        />
      )}
    </div>
  );
} 