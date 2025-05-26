import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Users, DollarSign, TrendingUp, Link2, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InviteDialog } from '@/components/affiliates/invite-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiAffiliates } from '@/lib/api';

export default function Affiliates() {
  console.log("Affiliates");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Fetch affiliates from backend
  const { data: affiliates, isLoading, isError } = useQuery({
    queryKey: ['affiliates'],
    queryFn: async () => (await apiAffiliates.getAll()).data,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affiliates</h1>
          <p className="text-muted-foreground">Manage your affiliate partners and performance</p>
        </div>
        <InviteDialog trigger={<Button onClick={() => setInviteDialogOpen(true)}>Invite Affiliate</Button>} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Affiliates</CardTitle>
              <CardDescription>
                A list of your current and pending affiliates.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading affiliates...</div>
          ) : isError ? (
            <div className="text-red-500">Failed to load affiliates.</div>
          ) : (
            <div className="space-y-6">
              {affiliates && affiliates.length > 0 ? affiliates.map((affiliate: any) => (
                <div 
                  key={affiliate.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback>{affiliate.name ? affiliate.name.split(' ').map((n: string) => n[0]).join('') : affiliate.email[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{affiliate.name || affiliate.email}</h3>
                      <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">${affiliate.earnings ? affiliate.earnings.toLocaleString() : '0'}</p>
                      <p className="text-sm text-muted-foreground">Total Earnings</p>
                    </div>
                    <Badge variant={affiliate.status === 'active' ? 'default' : 'secondary'}>
                      {affiliate.status}
                    </Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/affiliates/${affiliate.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Profile
                      </Link>
                    </Button>
                  </div>
                </div>
              )) : (
                <div>No affiliates found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}