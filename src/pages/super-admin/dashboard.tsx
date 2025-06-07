import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { PendingInfluencers } from '@/components/super-admin/PendingInfluencers';
import { ApprovedInfluencers } from '@/components/super-admin/ApprovedInfluencers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!user || user.email !== 'zopkit@gmail.com')) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || user.email !== 'zopkit@gmail.com') {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Super Admin Dashboard</h1>
      
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Influencers</TabsTrigger>
          <TabsTrigger value="approved">Approved Influencers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <PendingInfluencers />
        </TabsContent>
        
        <TabsContent value="approved">
          <ApprovedInfluencers />
        </TabsContent>
      </Tabs>
    </div>
  );
} 