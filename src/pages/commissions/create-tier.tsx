import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { apiCommissionTiers } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function CreateCommissionTier() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ tier_name: '', commission_percent: '', min_sales: '' });

  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      apiCommissionTiers.create({
        tierName: payload.tier_name,
        commissionPercent: parseFloat(payload.commission_percent),
        minSales: parseInt(payload.min_sales, 10),
      }),
    onSuccess: () => {
      toast({ title: 'Tier created successfully' });
      queryClient.invalidateQueries({ queryKey: ['commission-tiers'] });
      // Navigate back to tiers page after successful creation
      setTimeout(() => {
        navigate('/commissions/tiers');
      }, 1500);
    },
    onError: () => toast({ title: 'Error creating tier', variant: 'destructive' }),
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      tier_name: form.tier_name,
      commission_percent: parseFloat(form.commission_percent),
      min_sales: parseInt(form.min_sales, 10),
    });
  };

  return (
    <div className="container mx-auto py-8 px-2 sm:px-0 max-w-5xl">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
        onClick={() => navigate('/commissions/tiers')}
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="font-medium">Back to Commission Tiers</span>
      </Button>
      
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <CardHeader className="p-8 border-b">
          <CardTitle className="text-3xl font-bold text-gray-800">Create Commission Tier</CardTitle>
          <CardDescription>
            Set up a new commission tier with specific rates and requirements.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tierName">Tier Name</Label>
                <Input
                  id="tierName"
                  name="tier_name"
                  value={form.tier_name}
                  onChange={handleFormChange}
                  placeholder="e.g., Gold, Silver, Bronze"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  A descriptive name for this commission tier
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="commissionPercent">Commission Rate (%)</Label>
                <Input
                  id="commissionPercent"
                  name="commission_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={form.commission_percent}
                  onChange={handleFormChange}
                  placeholder="e.g., 10"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The percentage of commission for this tier
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="minSales">Minimum Sales</Label>
                <Input
                  id="minSales"
                  name="min_sales"
                  type="number"
                  min="0"
                  value={form.min_sales}
                  onChange={handleFormChange}
                  placeholder="e.g., 5"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  The minimum number of sales required to qualify for this tier
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/commissions/tiers')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="px-6"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Tier'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 