import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { apiProducts } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface TrackingLink {
  id: string;
  productId: string;
  trackingCode: string;
  totalClicks: number;
  totalConversions: number;
  totalSales: number;
  product: any | null;
}

export default function AffiliateDashboard() {
  const { toast } = useToast();
  const [productMap, setProductMap] = useState<Record<string, any>>({});
  const tenant = useAuthStore((state) => state.tenant);

  const { data: trackingLinks, isLoading, error } = useQuery<TrackingLink[]>({
    queryKey: ['affiliate-dashboard'],
    queryFn: async () => {
      const response = await api.get('/api/affiliates/dashboard');
      return response.data.trackingLinks.map((link: any) => ({
        id: link.id,
        productId: link.productId,
        trackingCode: link.trackingCode,
        totalClicks: link.totalClicks,
        totalConversions: link.totalConversions,
        totalSales: typeof link.totalSales === 'string' ? parseFloat(link.totalSales) : (link.totalSales ?? 0),
        product: link.product,
      }));
    },
  });

  const { data: productCommissions, isLoading: isLoadingComms } = useQuery<any[]>({
    queryKey: ['affiliate-product-commissions'],
    queryFn: async () => {
      const response = await api.get('/api/affiliates/product-commissions');
      return response.data;
    },
  });

  // Fetch missing product details
  useEffect(() => {
    if (!trackingLinks) return;
    const missingProductIds = trackingLinks
      .filter(link => !link.product && link.productId)
      .map(link => link.productId)
      .filter((id, idx, arr) => arr.indexOf(id) === idx && !productMap[id]);
    if (missingProductIds.length === 0) return;

    Promise.all(missingProductIds.map(id => apiProducts.getById(id)))
      .then(results => {
        const newMap: Record<string, any> = {};
        results.forEach((res, idx) => {
          newMap[missingProductIds[idx]] = res.data;
        });
        setProductMap(prev => ({ ...prev, ...newMap }));
      });
  }, [trackingLinks]);

  const copyTrackingLink = (code: string) => {
    const link = `${window.location.origin}/track/${code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Tracking link copied!',
      description: 'The tracking link has been copied to your clipboard.',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'Failed to load dashboard'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-background">
      <div className="w-full max-w-4xl py-8">
        {/* Tenant Card */}
        <Card className="mb-8 shadow-lg border-primary border-2">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">{tenant?.tenantName || 'Affiliate Program'}</CardTitle>
            <CardDescription className="text-muted-foreground">
              Welcome to the affiliate dashboard for <span className="font-semibold">{tenant?.tenantName || 'your program'}</span>.
            </CardDescription>
          </CardHeader>
        </Card>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your overall affiliate performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Clicks</h3>
                  <p className="text-2xl font-bold text-primary">
                    {trackingLinks?.reduce((sum, link) => sum + link.totalClicks, 0) || 0}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Conversions</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {trackingLinks?.reduce((sum, link) => sum + link.totalConversions, 0) || 0}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Sales</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ${trackingLinks?.reduce((sum, link) => sum + (typeof link.totalSales === 'number' && !isNaN(link.totalSales) ? link.totalSales : 0), 0).toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tracking Links</CardTitle>
              <CardDescription>Your product tracking links and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Tracking Link</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingLinks?.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell>
                        {link.product
                          ? link.product.name
                          : productMap[link.productId]
                            ? productMap[link.productId].name
                            : 'Unknown Product'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {link.trackingCode ? `${window.location.origin}/track/${link.trackingCode}` : 'N/A'}
                      </TableCell>
                      <TableCell>{link.totalClicks}</TableCell>
                      <TableCell>{link.totalConversions}</TableCell>
                      <TableCell>
                        {typeof link.totalSales === 'number' && !isNaN(link.totalSales)
                          ? link.totalSales.toFixed(2)
                          : '0.00'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (link.trackingCode) {
                              const linkUrl = `${window.location.origin}/track/${link.trackingCode}`;
                              navigator.clipboard.writeText(linkUrl);
                              toast({
                                title: 'Tracking link copied!',
                                description: 'The tracking link has been copied to your clipboard.',
                              });
                            }
                          }}
                        >
                          Copy Link
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Commissions</CardTitle>
              <CardDescription>Your commission details for each product</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingComms ? (
                <div>Loading product commissions...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Tier %</TableHead>
                      <TableHead>Product %</TableHead>
                      <TableHead>Final %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productCommissions?.map((comm) => (
                      <TableRow key={comm.id}>
                        <TableCell>{comm.productName || 'Unknown'}</TableCell>
                        <TableCell>{comm.tierName || 'Unknown'}</TableCell>
                        <TableCell>{comm.commissionPercent}%</TableCell>
                        <TableCell>{comm.productCommission}%</TableCell>
                        <TableCell>{comm.finalCommission}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 