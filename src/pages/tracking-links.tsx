import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useAffiliateStore } from '@/store/affiliate-store';
import { TrackingLinkList } from '@/components/affiliate/tracking-link-list';
import { useToast } from '@/hooks/use-toast';

const TrackingLinks: React.FC = () => {
  const { user, tenant } = useAuthStore();
  const { currentAffiliate, trackingLinks, loadAffiliate, loadTrackingLinks, isLoading, error } = useAffiliateStore();
  const { toast } = useToast();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user || !tenant) return;

        // First load the affiliate profile if not already loaded
        if (!currentAffiliate) {
          await loadAffiliate(user.id, tenant.id);
        }

        // Then load tracking links
        if (currentAffiliate) {
          await loadTrackingLinks(currentAffiliate.id, tenant.id);
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: error || 'Failed to load tracking links.',
          variant: 'destructive',
        });
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadData();
  }, [user, tenant, currentAffiliate]);

  const handleRefresh = () => {
    if (currentAffiliate && tenant) {
      loadTrackingLinks(currentAffiliate.id, tenant.id);
    }
  };

  // Sample tracking links data (for display when no real data is available)
  const sampleTrackingLinks = [
    {
      id: '1',
      tenantId: tenant?.id || 'tenant-1',
      affiliateId: currentAffiliate?.id || 'affiliate-1',
      destinationUrl: 'https://example.com/product-a',
      campaignName: 'Summer Sale',
      utmSource: currentAffiliate?.referralCode || 'aff123',
      utmMedium: 'email',
      utmCampaign: 'summer2025',
      utmContent: 'banner',
      utmTerm: null,
      shortCode: 'sum25',
      qrCodeUrl: '',
      status: 'active',
      expiresAt: null,
      clickCount: 156,
      conversionCount: 23,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      tenantId: tenant?.id || 'tenant-1',
      affiliateId: currentAffiliate?.id || 'affiliate-1',
      destinationUrl: 'https://example.com/product-b',
      campaignName: 'Black Friday',
      utmSource: currentAffiliate?.referralCode || 'aff123',
      utmMedium: 'social',
      utmCampaign: 'bf2025',
      utmContent: 'instagram',
      utmTerm: 'deals',
      shortCode: 'bf25',
      qrCodeUrl: '',
      status: 'active',
      expiresAt: new Date(2025, 11, 30).toISOString(),
      clickCount: 243,
      conversionCount: 18,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      tenantId: tenant?.id || 'tenant-1',
      affiliateId: currentAffiliate?.id || 'affiliate-1',
      destinationUrl: 'https://example.com/product-c',
      campaignName: 'Spring Collection',
      utmSource: currentAffiliate?.referralCode || 'aff123',
      utmMedium: 'blog',
      utmCampaign: 'spring2025',
      utmContent: 'review',
      utmTerm: null,
      shortCode: 'spr25',
      qrCodeUrl: '',
      status: 'paused',
      expiresAt: null,
      clickCount: 87,
      conversionCount: 9,
      createdAt: new Date().toISOString()
    }
  ];

  // Show loading state
  if (isInitialLoading) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight animate-pulse bg-muted h-10 w-1/3 rounded">&nbsp;</h1>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm animate-pulse h-[400px]"></div>
      </div>
    );
  }

  // Use real data if available, otherwise use sample data
  const displayLinks = trackingLinks.length > 0 ? trackingLinks : sampleTrackingLinks;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tracking Links</h1>
        <p className="text-muted-foreground">
          Create and manage tracking links to promote products and earn commissions.
        </p>
      </div>

      <TrackingLinkList links={displayLinks} onRefresh={handleRefresh} />
    </div>
  );
};

export default TrackingLinks;