import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface ProductCommission {
  id: string;
  productId: string;
  productName: string;
  tierName: string;
  tierPercentage: number;
  productPercentage: number;
  finalPercentage: number;
}

export default function AffiliateCommissions() {
  // Fetch product commissions
  const { data: commissions, isLoading, error } = useQuery<ProductCommission[]>({
    queryKey: ['affiliate-product-commissions'],
    queryFn: async () => {
      const response = await api.get('/api/affiliates/product-commissions');
      return response.data.map((commission: any) => ({
        id: commission.id,
        productId: commission.productId,
        productName: commission.product?.name || 'Unknown Product',
        tierName: commission.tierName || 'Standard',
        tierPercentage: commission.tierPercentage || 0,
        productPercentage: commission.productPercentage || 0,
        finalPercentage: commission.finalPercentage || commission.tierPercentage || commission.productPercentage || 0,
      }));
    },
  });

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
        {error instanceof Error ? error.message : 'Failed to load commission details'}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <Card className="overflow-hidden shadow-lg border-gray-200">
        <CardHeader className="border-b bg-muted/40 px-6">
          <CardTitle className="text-2xl">Product Commissions</CardTitle>
          <CardDescription>Your commission details for each product</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {commissions && commissions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Tier %</TableHead>
                    <TableHead className="text-right">Product %</TableHead>
                    <TableHead className="text-right">Final %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">
                        {commission.productName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {commission.tierName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{commission.tierPercentage.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">{commission.productPercentage.toFixed(2)}%</TableCell>
                      <TableCell className="text-right font-bold">{commission.finalPercentage.toFixed(2)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No commission details found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 