import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { StatCard } from '@/components/dashboard/stat-card';
import { 
  BarChart3, 
  DollarSign, 
  Globe, 
  Instagram, 
  Link2, 
  Mail, 
  MapPin, 
  Phone, 
  Star, 
  TrendingUp, 
  Twitter, 
  Youtube 
} from 'lucide-react';

// Sample affiliate data
const sampleAffiliate = {
  id: '1',
  name: 'Sarah Johnson',
  email: 'sarah@example.com',
  phone: '+1 (555) 123-4567',
  location: 'New York, USA',
  avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
  referralCode: 'SARAH2025',
  status: 'active',
  tier: 'Gold',
  joinDate: '2025-01-15',
  website: 'https://sarahjohnson.com',
  socialMedia: {
    instagram: { handle: '@sarahjstyle', followers: 125000 },
    youtube: { handle: 'SarahJStyle', followers: 50000 },
    twitter: { handle: '@sarahjstyle', followers: 35000 }
  },
  metrics: {
    totalSales: 245000,
    totalCommissions: 36750,
    activeLinks: 12,
    conversionRate: 4.8,
    clickCount: 15600,
    avgOrderValue: 185
  },
  recentActivity: [
    {
      type: 'sale',
      amount: 750,
      commission: 112.50,
      date: '2025-03-15',
      product: 'Premium Package'
    },
    {
      type: 'link_click',
      count: 250,
      date: '2025-03-14',
      campaign: 'Summer Sale'
    }
  ]
};

const sampleSalesData = [
  { name: 'Jan', sales: 24500, commissions: 3675 },
  { name: 'Feb', sales: 18750, commissions: 2812 },
  { name: 'Mar', sales: 32000, commissions: 4800 },
  { name: 'Apr', sales: 28500, commissions: 4275 },
  { name: 'May', sales: 35000, commissions: 5250 },
  { name: 'Jun', sales: 42000, commissions: 6300 },
  { name: 'Jul', sales: 38000, commissions: 5700 }
];

export default function AffiliateProfile() {
  const { id } = useParams();
  
  // In production, fetch affiliate data based on ID
  const affiliate = sampleAffiliate;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      notation: num > 9999 ? 'compact' : 'standard',
      maximumFractionDigits: 1
    }).format(num);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-background">
      <div className="w-full max-w-6xl px-4 py-8 mx-auto space-y-8">
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-8">
              <Avatar className="h-32 w-32 mx-auto">
                <AvatarImage src={affiliate.avatar} />
                <AvatarFallback>{affiliate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              
              <div className="w-full max-w-3xl mx-auto space-y-6 text-center">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">{affiliate.name}</h1>
                    <p className="text-muted-foreground">{`Affiliate since ${affiliate.joinDate}`}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'} className="px-4 py-1">
                      {affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="px-4 py-1">{affiliate.tier}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 place-items-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground w-full">
                    <Mail className="h-4 w-4" />
                    <span>{affiliate.email}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground w-full">
                    <Phone className="h-4 w-4" />
                    <span>{affiliate.phone}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground w-full">
                    <MapPin className="h-4 w-4" />
                    <span>{affiliate.location}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground w-full">
                    <Globe className="h-4 w-4" />
                    <a href={affiliate.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Website
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 place-items-center">
          <StatCard 
            title="Total Sales" 
            value={`$${formatNumber(affiliate.metrics.totalSales)}`}
            description="Lifetime sales value"
            icon={<DollarSign className="h-4 w-4" />}
            change={{ value: 12.5, trend: 'up' }}
            className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow w-full"
          />
          <StatCard 
            title="Commissions" 
            value={`$${formatNumber(affiliate.metrics.totalCommissions)}`}
            description="Total earnings"
            icon={<BarChart3 className="h-4 w-4" />}
            change={{ value: 8.2, trend: 'up' }}
            className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow w-full"
          />
          <StatCard 
            title="Conversion Rate" 
            value={`${affiliate.metrics.conversionRate}%`}
            description={`${formatNumber(affiliate.metrics.clickCount)} total clicks`}
            icon={<TrendingUp className="h-4 w-4" />}
            change={{ value: 0.8, trend: 'up' }}
            className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow w-full"
          />
          <StatCard 
            title="Avg Order Value" 
            value={`$${affiliate.metrics.avgOrderValue}`}
            description="Per conversion"
            icon={<Star className="h-4 w-4" />}
            change={{ value: 5.3, trend: 'up' }}
            className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow w-full"
          />
        </div>

        <Tabs defaultValue="performance" className="space-y-6">
          <div className="flex justify-center w-full">
            <TabsList className="inline-flex mx-auto">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="tracking">Tracking Links</TabsTrigger>
              <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
              <TabsTrigger value="payouts">Payouts</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="performance">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Sales & Commissions</CardTitle>
                <CardDescription>Monthly performance overview</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-full max-w-4xl mx-auto">
                  <SalesChart data={sampleSalesData} title="" className="h-[400px]" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Active Tracking Links</CardTitle>
                <CardDescription>Currently active promotional links</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-4xl mx-auto space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-6 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="text-center flex-1">
                        <p className="font-medium">Summer Sale Campaign</p>
                        <p className="text-sm text-muted-foreground">Created on Mar 15, 2025</p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-sm font-medium">458 clicks</p>
                        <p className="text-sm text-muted-foreground">32 conversions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}