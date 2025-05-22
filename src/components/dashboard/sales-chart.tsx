import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTheme } from 'next-themes';

interface SalesChartProps {
  data: {
    name: string;
    sales: number;
    commissions: number;
  }[];
  title: string;
  className?: string;
}

export function SalesChart({ data, title, className }: SalesChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? 'hsl(var(--muted-foreground))' : 'hsl(var(--muted-foreground))';
  const gridColor = isDark ? 'hsl(var(--border))' : 'hsl(var(--border))';
  const areaColor1 = 'hsl(var(--chart-1))';
  const areaColor2 = 'hsl(var(--chart-2))';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke={textColor} 
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
              />
              <YAxis 
                stroke={textColor} 
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: gridColor }}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), '']}
                contentStyle={{ 
                  backgroundColor: isDark ? 'hsl(var(--card))' : 'hsl(var(--card))', 
                  borderColor: gridColor,
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
                labelStyle={{ 
                  color: isDark ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))',
                  fontWeight: 'bold',
                  marginBottom: '4px'
                }}
              />
              <Legend 
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ color: textColor, fontSize: '12px' }}>
                    {value === 'sales' ? 'Sales Amount' : 'Commission Amount'}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke={areaColor1}
                fill={areaColor1}
                fillOpacity={0.1}
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="commissions"
                stroke={areaColor2}
                fill={areaColor2}
                fillOpacity={0.1}
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}