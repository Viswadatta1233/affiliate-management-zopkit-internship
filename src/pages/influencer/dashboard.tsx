import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import { User, Mail, Calendar, Building, Award } from "lucide-react";

export default function InfluencerDashboard() {
  const { user, role } = useAuthStore();

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Name:</span>
                <span>{user.firstName} {user.lastName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Joined:</span>
                <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Role:</span>
                <span className="capitalize">{role?.roleName.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Status:</span>
                <span className="capitalize">{role?.roleName === 'influencer' ? 'Approved' : 'Pending Approval'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}