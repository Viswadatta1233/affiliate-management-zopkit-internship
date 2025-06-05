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
import { api } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';

export default function Affiliates() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileAffiliateId, setProfileAffiliateId] = useState<string | null>(null);

  // Fetch affiliates with products and commission status
  const { data: affiliates, isLoading, isError, refetch } = useQuery({
    queryKey: ['affiliates-with-products'],
    queryFn: async () => (await api.get('/api/affiliates/with-products')).data,
  });

  // Fetch affiliate profile details when modal is open
  const { data: affiliateProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['affiliate-profile', profileAffiliateId],
    queryFn: async () => {
      if (!profileAffiliateId) return null;
      return (await api.get(`/api/affiliates/details?userId=${profileAffiliateId}`)).data;
    },
    enabled: !!profileAffiliateId && profileDialogOpen,
  });

  // Handler to update commission status
  const handleCommissionToggle = async (affiliateId: string, productId: string, checked: boolean) => {
    try {
      await api.put('/api/affiliates/product-commission', {
        affiliateId,
        productId,
        useProductCommission: checked,
      });
      toast({ title: 'Commission status updated' });
      refetch();
    } catch (error: any) {
      toast({ title: 'Failed to update commission', description: error.message, variant: 'destructive' });
    }
  };

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
                  className="flex flex-col gap-2 p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback>{affiliate.firstName ? affiliate.firstName[0] : affiliate.email[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{affiliate.firstName || affiliate.email} {affiliate.lastName || ''}</h3>
                        <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                      </div>
                    </div>
                    <Dialog open={profileDialogOpen && profileAffiliateId === affiliate.id} onOpenChange={open => { setProfileDialogOpen(open); if (!open) setProfileAffiliateId(null); }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => { setProfileAffiliateId(affiliate.id); setProfileDialogOpen(true); }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Affiliate Profile</DialogTitle>
                        </DialogHeader>
                        {isProfileLoading ? (
                          <div>Loading profile...</div>
                        ) : affiliateProfile ? (
                          <div className="space-y-2">
                            <div><b>Name:</b> {affiliate.firstName || affiliate.email} {affiliate.lastName || ''}</div>
                            <div><b>Email:</b> {affiliate.email}</div>
                            <div><b>Referral Code:</b> {affiliateProfile.referralCode || 'N/A'}</div>
                            <div><b>Current Tier:</b> {affiliateProfile.currentTier || 'N/A'}</div>
                            <div><b>Website URL:</b> {affiliateProfile.websiteUrl || 'N/A'}</div>
                            <div><b>Social Media:</b> {Object.entries(affiliateProfile.socialMedia || {}).map(([k, v]) => v ? `${k}: ${v}` : null).filter(Boolean).join(', ') || 'N/A'}</div>
                            <div><b>Promotional Methods:</b> {affiliateProfile.promotionalMethods?.join(', ') || 'N/A'}</div>
                          </div>
                        ) : (
                          <div>No profile data found.</div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                  {/* Product commissions table */}
                  <div className="mt-2">
                    <div className="font-semibold mb-1">Products & Commission Status</div>
                    {affiliate.products && affiliate.products.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-2 text-left">Product</th>
                              <th className="p-2 text-left">Commission %</th>
                              <th className="p-2 text-left">Use Product Commission</th>
                            </tr>
                          </thead>
                          <tbody>
                            {affiliate.products.map((product: any) => (
                              <tr key={product.id} className="border-t">
                                <td className="p-2">{product.name}</td>
                                <td className="p-2">{product.commissionPercent}%</td>
                                <td className="p-2">
                                  <Checkbox
                                    checked={product.useProductCommission}
                                    onCheckedChange={(checked) => handleCommissionToggle(affiliate.id, product.id, checked as boolean)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">No products assigned.</div>
                    )}
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