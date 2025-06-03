import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Building2, Star, Users, Mail } from 'lucide-react';
import { api } from '@/lib/api';

interface Affiliate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CommissionTier {
  id: string;
  tierName: string;
  commissionPercent: string;
  minSales: number;
  createdAt: string;
  affiliates: Affiliate[];
  affiliateCount: number;
}

const AffiliateTiers: React.FC = () => {
  const { user, tenant } = useAuthStore();
  const [tiers, setTiers] = useState<CommissionTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tiersResponse = await api.get('/api/commissions/tiers');
        setTiers(tiersResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Affiliate Tiers</h1>
        <p className="text-muted-foreground">
          View commission tiers and their associated affiliates.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-6">Loading...</div>
      ) : tiers.length > 0 ? (
        <div className="space-y-8">
          {tiers.map((tier) => (
            <Card key={tier.id} className="overflow-hidden">
              <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{tier.tierName}</CardTitle>
                      <CardDescription>
                        Created {format(new Date(tier.createdAt), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Commission Rate</div>
                      <div className="text-xl font-semibold">{tier.commissionPercent}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Min. Monthly Sales</div>
                      <div className="text-xl font-semibold">{tier.minSales}</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Affiliates ({tier.affiliateCount})</span>
                </div>
                {tier.affiliateCount > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tier.affiliates.map((affiliate) => (
                      <div
                        key={affiliate.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{affiliate.email.split('@')[0]}</div>
                          <div className="text-sm text-muted-foreground">{affiliate.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No affiliates in this tier yet
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No tiers configured</p>
            <p className="text-sm">Commission tiers will appear here once created</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AffiliateTiers;