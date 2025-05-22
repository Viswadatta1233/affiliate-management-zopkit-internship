import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export function StatCard({ title, value, description, icon, change, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
      {change && (
        <CardFooter className="p-2">
          <div
            className={cn(
              "text-xs font-medium",
              change.trend === 'up' && "text-emerald-500",
              change.trend === 'down' && "text-rose-500",
              change.trend === 'neutral' && "text-muted-foreground"
            )}
          >
            {change.trend === 'up' && '↑ '}
            {change.trend === 'down' && '↓ '}
            {change.trend === 'neutral' && '→ '}
            {change.value}% from last period
          </div>
        </CardFooter>
      )}
    </Card>
  );
}