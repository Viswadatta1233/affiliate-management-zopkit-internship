import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { apiProducts } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { 
  BarChart3, 
  DollarSign, 
  Link2, 
  TrendingUp, 
  ArrowUpRight,
  ChevronRight,
  Copy,
  Percent,
  BarChart,
  LineChart,
  PieChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  const queryClient = useQueryClient();
  const location = useLocation();

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

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/track/${code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Tracking link copied!',
      description: 'The tracking link has been copied to your clipboard.',
    });
  };

  const handleLogout = () => {
    // Clear auth state
    useAuthStore.getState().logout();
    // Clear query cache
    queryClient.clear();
    // Redirect to login
    window.location.href = '/login';
  };

  // Calculate metrics
  const totalClicks = trackingLinks?.reduce((sum, link) => sum + link.totalClicks, 0) || 0;
  const totalConversions = trackingLinks?.reduce((sum, link) => sum + link.totalConversions, 0) || 0;
  const totalSales = trackingLinks?.reduce((sum, link) => sum + (typeof link.totalSales === 'number' && !isNaN(link.totalSales) ? link.totalSales : 0), 0) || 0;
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0';
  const averageOrderValue = totalConversions > 0 ? (totalSales / totalConversions).toFixed(2) : '0';

  // Sort links by performance
  const sortedLinks = trackingLinks ? [...trackingLinks].sort((a, b) => b.totalSales - a.totalSales) : [];
  const topPerformingLinks = sortedLinks.slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
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
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Welcome to {tenant?.tenantName || 'Your Affiliate Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your performance, manage links, and maximize your earnings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <RouterLink to="/affiliate/links">
              View All Links <ChevronRight className="ml-1 h-4 w-4" />
            </RouterLink>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <RouterLink to="/affiliate/commissions">
              View All Commissions <ChevronRight className="ml-1 h-4 w-4" />
            </RouterLink>
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Total Clicks</CardDescription>
              <CardTitle className="text-3xl font-bold">{totalClicks.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4 mr-1 text-primary" />
                <span>Traffic volume</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Conversions</CardDescription>
              <CardTitle className="text-3xl font-bold">{totalConversions.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                <span>{conversionRate}% conversion rate</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Total Sales</CardDescription>
              <CardTitle className="text-3xl font-bold">${totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4 mr-1 text-blue-600" />
                <span>${averageOrderValue} avg. order value</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription>Active Links</CardDescription>
              <CardTitle className="text-3xl font-bold">{trackingLinks?.length || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Link2 className="h-4 w-4 mr-1 text-purple-600" />
                <span>Across {new Set(trackingLinks?.map(link => link.productId)).size || 0} products</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

     

      {/* Main Content Tabs */}
      <div className="mt-8">
        <Tabs defaultValue="links" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="links">Tracking Links</TabsTrigger>
            <TabsTrigger value="commissions">Product Commissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="links" className="mt-4">
            <Card>
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tracking Links</CardTitle>
                    <CardDescription>Your product tracking links and their performance</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <RouterLink to="/affiliate/links">
                      View All <ChevronRight className="ml-1 h-4 w-4" />
                    </RouterLink>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-b-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Product</TableHead>
                        <TableHead>Tracking Code</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">Conv.</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trackingLinks && trackingLinks.length > 0 ? (
                        trackingLinks.slice(0, 5).map((link) => (
                          <TableRow key={link.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">
                              {link.product
                                ? link.product.name
                                : productMap[link.productId]
                                  ? productMap[link.productId].name
                                  : 'Unknown Product'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {link.trackingCode ? link.trackingCode : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">{link.totalClicks}</TableCell>
                            <TableCell className="text-right">{link.totalConversions}</TableCell>
                            <TableCell className="text-right">
                              ${typeof link.totalSales === 'number' && !isNaN(link.totalSales)
                                ? link.totalSales.toFixed(2)
                                : '0.00'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleCopyLink(link.trackingCode)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            No tracking links found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              {trackingLinks && trackingLinks.length > 5 && (
                <CardFooter className="flex justify-center py-4 border-t">
                  <Button variant="ghost" size="sm" asChild>
                    <RouterLink to="/affiliate/links">
                      View all {trackingLinks.length} tracking links
                    </RouterLink>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="commissions" className="mt-4">
            <Card>
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Commissions</CardTitle>
                    <CardDescription>Your commission details for each product</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <RouterLink to="/affiliate/commissions">
                      View All <ChevronRight className="ml-1 h-4 w-4" />
                    </RouterLink>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-b-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Product</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead className="text-right">Tier %</TableHead>
                        <TableHead className="text-right">Product %</TableHead>
                        <TableHead className="text-right">Final %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productCommissions && productCommissions.length > 0 ? (
                        productCommissions.slice(0, 5).map((comm) => (
                          <TableRow key={comm.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium">{comm.productName || 'Unknown'}</TableCell>
                            <TableCell>{comm.tierName || 'Unknown'}</TableCell>
                            <TableCell className="text-right">{comm.commissionPercent}%</TableCell>
                            <TableCell className="text-right">{comm.productCommission}%</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="font-medium">
                                {comm.finalCommission}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            No commission data found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              {productCommissions && productCommissions.length > 5 && (
                <CardFooter className="flex justify-center py-4 border-t">
                  <Button variant="ghost" size="sm" asChild>
                    <RouterLink to="/affiliate/commissions">
                      View all {productCommissions.length} product commissions
                    </RouterLink>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      
    </div>
  );
}