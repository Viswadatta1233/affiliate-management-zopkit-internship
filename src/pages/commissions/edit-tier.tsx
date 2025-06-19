import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiCommissionTiers } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function EditCommissionTier() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ tier_name: '', commission_percent: '', min_sales: '' });

  // Fetch all tiers and filter by ID
  const { data: allTiers, isLoading } = useQuery({
    queryKey: ['commission-tiers'],
    queryFn: async () => (await apiCommissionTiers.getAll()).data,
  });
  const tier = allTiers?.find((t: any) => t.id === id);

  useEffect(() => {
    if (tier) {
      setForm({
        tier_name: tier.tier_name || tier.tierName || '',
        commission_percent: String(tier.commission_percent || tier.commissionPercent || ''),
        min_sales: String(tier.min_sales || tier.minSales || ''),
      });
    }
  }, [tier]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      apiCommissionTiers.update(id!, {
        tierName: payload.tier_name,
        commissionPercent: parseFloat(payload.commission_percent),
        minSales: parseInt(payload.min_sales, 10),
      }),
    onSuccess: () => {
      toast({ title: 'Tier updated' });
      console.log('Navigating to /commissions/tiers after update');
      queryClient.invalidateQueries({ queryKey: ['commission-tiers'] });
      navigate('/commissions/tiers');
    },
    onError: (error) => {
      console.error('Error updating tier:', error);
      toast({ title: 'Error updating tier', variant: 'destructive' });
    },
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <div className="container mx-auto p-8 max-w-xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Edit Commission Tier</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : !tier ? (
            <div>Tier not found.</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="tier_name">Tier Name</Label>
                <Input
                  id="tier_name"
                  name="tier_name"
                  value={form.tier_name}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="commission_percent">Commission Percent (%)</Label>
                <Input
                  id="commission_percent"
                  name="commission_percent"
                  type="number"
                  step="0.01"
                  value={form.commission_percent}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="min_sales">Minimum Sales</Label>
                <Input
                  id="min_sales"
                  name="min_sales"
                  type="number"
                  value={form.min_sales}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/commissions/tiers')}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 