import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Copy, Plus } from 'lucide-react';

interface TrackingLink {
  id: string;
  productId: string;
  trackingCode: string;
  totalClicks: number;
  totalConversions: number;
  totalSales: number;
  product: any | null;
}

export default function AffiliateTrackingLinks() {
  const { toast } = useToast();
  
  // Fetch tracking links
  const { data: trackingLinks, isLoading, error } = useQuery<TrackingLink[]>({
    queryKey: ['affiliate-tracking-links'],
    queryFn: async () => {
      const response = await api.get('/api/affiliates/tracking-links');
      return response.data.map((link: any) => ({
        id: link.id,
        productId: link.productId,
        trackingCode: link.trackingCode,
        totalClicks: link.totalClicks || 0,
        totalConversions: link.totalConversions || 0,
        totalSales: typeof link.totalSales === 'string' ? parseFloat(link.totalSales) : (link.totalSales ?? 0),
        product: link.product,
      }));
    },
  });

  // Handle copy link to clipboard
  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/track/${code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Tracking link copied!',
      description: 'The tracking link has been copied to your clipboard.',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        {error instanceof Error ? error.message : 'Failed to load tracking links'}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <Card className="overflow-hidden shadow-lg border-gray-200">
        <CardHeader className="border-b bg-muted/40 px-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Your Tracking Links</CardTitle>
              <CardDescription>Your product tracking links and their performance</CardDescription>
            </div>
            <Button variant="default" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create New Link
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {trackingLinks && trackingLinks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Tracking Link</TableHead>
                    <TableHead className="text-right">Clicks</TableHead>
                    <TableHead className="text-right">Conversions</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingLinks.map((link) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">
                        {link.product?.name || 'Unknown Product'}
                      </TableCell>
                      <TableCell className="font-mono text-sm truncate max-w-xs">
                        {`${window.location.origin}/track/${link.trackingCode}`}
                      </TableCell>
                      <TableCell className="text-right">{link.totalClicks}</TableCell>
                      <TableCell className="text-right">{link.totalConversions}</TableCell>
                      <TableCell className="text-right">${link.totalSales.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopyLink(link.trackingCode)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Link
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tracking links found.</p>
              <Button className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Tracking Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 