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
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={affiliate.avatar} />
              <AvatarFallback>{affiliate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{affiliate.name}</h1>
                  <p className="text-muted-foreground">Affiliate since {affiliate.joinDate}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                    {affiliate.status}
                  </Badge>
                  <Badge variant="outline">{affiliate.tier}</Badge>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{affiliate.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{affiliate.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{affiliate.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{affiliate.referralCode}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-6">
                {affiliate.website && (
                  <a 
                    href={affiliate.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {Object.entries(affiliate.socialMedia).map(([platform, data]) => (
                  <div key={platform} className="flex items-center gap-2">
                    {platform === 'instagram' && <Instagram className="h-4 w-4" />}
                    {platform === 'youtube' && <Youtube className="h-4 w-4" />}
                    {platform === 'twitter' && <Twitter className="h-4 w-4" />}
                    <span className="text-sm font-medium">
                      {formatNumber(data.followers)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Sales" 
          value={`$${formatNumber(affiliate.metrics.totalSales)}`}
          description="Lifetime sales value"
          icon={<DollarSign className="h-4 w-4" />}
          change={{ value: 12.5, trend: 'up' }}
        />
        <StatCard 
          title="Commissions" 
          value={`$${formatNumber(affiliate.metrics.totalCommissions)}`}
          description="Total earnings"
          icon={<BarChart3 className="h-4 w-4" />}
          change={{ value: 8.2, trend: 'up' }}
        />
        <StatCard 
          title="Conversion Rate" 
          value={`${affiliate.metrics.conversionRate}%`}
          description={`${formatNumber(affiliate.metrics.clickCount)} total clicks`}
          icon={<TrendingUp className="h-4 w-4" />}
          change={{ value: 0.8, trend: 'up' }}
        />
        <StatCard 
          title="Avg Order Value" 
          value={`$${affiliate.metrics.avgOrderValue}`}
          description="Per conversion"
          icon={<Star className="h-4 w-4" />}
          change={{ value: 5.3, trend: 'up' }}
        />
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tracking">Tracking Links</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Sales & Commissions</CardTitle>
              <CardDescription>Monthly performance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <SalesChart data={sampleSalesData} title="" className="h-[350px]" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <CardTitle>Active Tracking Links</CardTitle>
              <CardDescription>Currently active promotional links</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Summer Sale Campaign</p>
                      <p className="text-sm text-muted-foreground">Created on Mar 15, 2025</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">458 clicks</p>
                      <p className="text-sm text-muted-foreground">32 conversions</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Participation</CardTitle>
              <CardDescription>Active and past campaign performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Spring Collection 2025</p>
                      <p className="text-sm text-muted-foreground">Mar 1 - Apr 30, 2025</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">$12,500 in sales</p>
                      <p className="text-sm text-muted-foreground">$1,875 earned</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Recent commission payouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">March 2025 Payout</p>
                      <p className="text-sm text-muted-foreground">Processed on Apr 1, 2025</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">$2,850.00</p>
                      <Badge variant="outline">Completed</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}