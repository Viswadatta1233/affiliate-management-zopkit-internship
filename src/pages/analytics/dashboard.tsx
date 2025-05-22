import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CustomDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>Revenue generated through affiliates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Affiliates</CardTitle>
            <CardDescription>Number of active affiliates this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
            <CardDescription>Average conversion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest analytics events</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}