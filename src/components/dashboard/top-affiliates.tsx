import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';

interface Affiliate {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  sales: number;
  commissions: number;
  status: 'active' | 'pending' | 'suspended';
  tierName: string;
}

interface TopAffiliatesProps {
  affiliates: Affiliate[];
  className?: string;
}

export function TopAffiliates({ affiliates, className }: TopAffiliatesProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Top Performing Affiliates</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-8">
          {affiliates.map((affiliate) => (
            <div key={affiliate.id} className="flex items-center px-6">
              <Avatar className="h-9 w-9">
                <AvatarImage src={affiliate.avatar} alt={affiliate.name} />
                <AvatarFallback>{affiliate.initials}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1 flex-1">
                <p className="text-sm font-medium leading-none">{affiliate.name}</p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Badge
                    variant="outline"
                    className={`mr-2 ${
                      affiliate.status === 'active'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20'
                        : affiliate.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                    }`}
                  >
                    {affiliate.status.charAt(0).toUpperCase() + affiliate.status.slice(1)}
                  </Badge>
                  <span>{affiliate.tierName}</span>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm font-medium">{formatCurrency(affiliate.sales)}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(affiliate.commissions)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}