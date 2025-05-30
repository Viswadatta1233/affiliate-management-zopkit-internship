import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { StatCard } from '@/components/dashboard/stat-card';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { TopAffiliates } from '@/components/dashboard/top-affiliates';
import { Button } from '@/components/ui/button';
import { ArrowDownUp, BarChart3, DollarSign, TrendingUp, Users } from 'lucide-react';

// Sample dashboard data
const sampleSalesData = [
  { name: 'Jan', sales: 4000, commissions: 1240 },
  { name: 'Feb', sales: 3000, commissions: 1100 },
  { name: 'Mar', sales: 5000, commissions: 1800 },
  { name: 'Apr', sales: 4500, commissions: 1550 },
  { name: 'May', sales: 6000, commissions: 2100 },
  { name: 'Jun', sales: 8000, commissions: 2900 },
  { name: 'Jul', sales: 7500, commissions: 2700 },
];

const sampleAffiliates = [
  {
    id: '1',
    name: 'Jane Smith',
    initials: 'JS',
    sales: 24500,
    commissions: 3675,
    status: 'active' as const,
    tierName: 'Gold'
  },
  {
    id: '2',
    name: 'Alex Johnson',
    initials: 'AJ',
    sales: 18750,
    commissions: 2812.5,
    status: 'active' as const,
    tierName: 'Silver'
  },
  {
    id: '3',
    name: 'Lisa Brown',
    initials: 'LB',
    sales: 15200,
    commissions: 2280,
    status: 'active' as const,
    tierName: 'Bronze'
  },
  {
    id: '4',
    name: 'David Miller',
    initials: 'DM',
    sales: 9800,
    commissions: 1470,
    status: 'active' as const,
    tierName: 'Bronze'
  },
  {
    id: '5',
    name: 'Sarah Wilson',
    initials: 'SW',
    sales: 7200,
    commissions: 1080,
    status: 'pending' as const,
    tierName: 'Standard'
  }
];

const Dashboard: React.FC = () => {
  const { user, tenant, role, loadUserData } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState('month');

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!mounted) return;
      
      try {
        // Only load if we don't have user data
        if (!user || !tenant || !role) {
          await loadUserData();
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [loadUserData, user, tenant, role]);

  // Show loading state only if we're actually loading and don't have user data
  if (isLoading && (!user || !tenant || !role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName}! Here's an overview of your affiliate program.
          </p>
        </div>

        <div className="flex items-center mt-4 md:mt-0 space-x-2">
          <Button
            variant={timeFrame === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFrame('week')}
          >
            Week
          </Button>
          <Button
            variant={timeFrame === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFrame('month')}
          >
            Month
          </Button>
          <Button
            variant={timeFrame === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFrame('quarter')}
          >
            Quarter
          </Button>
          <Button
            variant={timeFrame === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFrame('year')}
          >
            Year
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Sales" 
          value="$42,350"
          description="From all affiliate channels"
          icon={<DollarSign className="h-4 w-4" />}
          change={{ value: 12.5, trend: 'up' }}
          className="bg-white shadow-sm rounded-lg"
        />
        <StatCard 
          title="Commissions" 
          value="$8,470"
          description="Paid out to affiliates"
          icon={<ArrowDownUp className="h-4 w-4" />} 
          change={{ value: 8.2, trend: 'up' }}
          className="bg-white shadow-sm rounded-lg"
        />
        <StatCard 
          title="Conversion Rate" 
          value="3.2%"
          description="From clicks to sales"
          icon={<TrendingUp className="h-4 w-4" />}
          change={{ value: 0.8, trend: 'up' }}
          className="bg-white shadow-sm rounded-lg"
        />
        <StatCard 
          title="Active Affiliates" 
          value="28"
          description="Out of 42 total affiliates"
          icon={<Users className="h-4 w-4" />}
          change={{ value: 4, trend: 'up' }}
          className="bg-white shadow-sm rounded-lg"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <SalesChart 
          data={sampleSalesData} 
          title="Sales & Commissions" 
          className="md:col-span-4"
        />
        <TopAffiliates 
          affiliates={sampleAffiliates} 
          className="md:col-span-3"
        />
      </div>
    </div>
  );
};

export default Dashboard;