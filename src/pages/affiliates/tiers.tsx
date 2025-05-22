import React from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Building2, Plus, Star } from 'lucide-react';

// Sample tiers data
const affiliateTiers = [
  {
    id: '1',
    name: 'Bronze',
    level: 1,
    minMonthlySales: 1000,
    minActiveReferrals: 0,
    baseCommissionRate: 10,
    rolloverRate: 0,
    bonusThreshold: null,
    bonusAmount: null,
    status: 'active',
    affiliateCount: 15,
    effectiveDate: new Date(2025, 0, 1)
  },
  {
    id: '2',
    name: 'Silver',
    level: 2,
    minMonthlySales: 5000,
    minActiveReferrals: 2,
    baseCommissionRate: 15,
    rolloverRate: 2,
    bonusThreshold: 10000,
    bonusAmount: 500,
    status: 'active',
    affiliateCount: 8,
    effectiveDate: new Date(2025, 0, 1)
  },
  {
    id: '3',
    name: 'Gold',
    level: 3,
    minMonthlySales: 10000,
    minActiveReferrals: 5,
    baseCommissionRate: 20,
    rolloverRate: 5,
    bonusThreshold: 25000,
    bonusAmount: 1000,
    status: 'active',
    affiliateCount: 4,
    effectiveDate: new Date(2025, 0, 1)
  }
];

const AffiliateTiers: React.FC = () => {
  const { user, tenant } = useAuthStore();

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affiliate Tiers</h1>
          <p className="text-muted-foreground">
            Manage your affiliate tier structure and requirements.
          </p>
        </div>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create New Tier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Affiliate Tiers</CardTitle>
          <CardDescription>
            Configure commission rates and requirements for each tier level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Commission Rate</TableHead>
                <TableHead className="text-right hidden md:table-cell">Min. Monthly Sales</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Min. Referrals</TableHead>
                <TableHead className="text-right hidden xl:table-cell">Bonus</TableHead>
                <TableHead className="text-center">Affiliates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliateTiers.map((tier) => (
                <TableRow key={tier.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Star className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{tier.name}</div>
                        <div className="text-xs text-muted-foreground">Level {tier.level}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {tier.baseCommissionRate}%
                    {tier.rolloverRate > 0 && (
                      <div className="text-xs text-muted-foreground">
                        +{tier.rolloverRate}% rollover
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {formatCurrency(tier.minMonthlySales)}
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell">
                    {tier.minActiveReferrals}
                  </TableCell>
                  <TableCell className="text-right hidden xl:table-cell">
                    {tier.bonusThreshold ? (
                      <>
                        {formatCurrency(tier.bonusAmount!)}
                        <div className="text-xs text-muted-foreground">
                          at {formatCurrency(tier.bonusThreshold)}
                        </div>
                      </>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {tier.affiliateCount}
                  </TableCell>
                  <TableCell>{getStatusBadge(tier.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {affiliateTiers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Building2 className="h-8 w-8 mb-2" />
                      <p>No tiers configured</p>
                      <p className="text-sm">Create your first affiliate tier</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateTiers;