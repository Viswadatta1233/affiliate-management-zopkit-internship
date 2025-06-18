import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiCommissionTiers } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function CommissionTiers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTier, setEditTier] = useState<any | null>(null);
  const [form, setForm] = useState({ tier_name: '', commission_percent: '', min_sales: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['commission-tiers'],
    queryFn: async () => (await apiCommissionTiers.getAll()).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) =>
      apiCommissionTiers.create({
        tierName: payload.tier_name,
        commissionPercent: parseFloat(payload.commission_percent),
        minSales: parseInt(payload.min_sales, 10),
      }),
    onSuccess: () => {
      toast({ title: 'Tier created' });
      setIsDialogOpen(false);
      setForm({ tier_name: '', commission_percent: '', min_sales: '' });
      queryClient.invalidateQueries({ queryKey: ['commission-tiers'] });
    },
    onError: () => toast({ title: 'Error creating tier', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: any) =>
      apiCommissionTiers.update(id, {
        tierName: payload.tier_name,
        commissionPercent: parseFloat(payload.commission_percent),
        minSales: parseInt(payload.min_sales, 10),
      }),
    onSuccess: () => {
      toast({ title: 'Tier updated' });
      setEditTier(null);
      queryClient.invalidateQueries({ queryKey: ['commission-tiers'] });
    },
    onError: () => toast({ title: 'Error updating tier', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiCommissionTiers.delete(id),
    onSuccess: () => {
      toast({ title: 'Tier deleted' });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['commission-tiers'] });
    },
    onError: () => toast({ title: 'Error deleting tier', variant: 'destructive' }),
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

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTier) return;
    updateMutation.mutate({
      id: editTier.id,
      tier_name: editTier.tier_name,
      commission_percent: parseFloat(editTier.commission_percent),
      min_sales: parseInt(editTier.min_sales, 10),
    });
  };

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Tiers</h1>
          <p className="text-muted-foreground">Manage commission tier structure</p>
        </div>
        <Button className="shadow-md" onClick={() => navigate('/commissions/tiers/create')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Tier
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-md p-6 w-full overflow-x-auto">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Commission Tiers</h2>
          <p className="text-muted-foreground">Configure tier-based commission rates</p>
        </div>
        {isLoading ? (
          <div className="text-center py-6">Loading...</div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-lg">No commission tiers found.</div>
        ) : (
          <>
            {/* Mobile Card/List View */}
            <div className="block md:hidden">
              {data.map((tier: any) => (
                <div key={tier.id} className="mb-4 p-4 rounded-lg shadow bg-gray-50">
                  <div className="font-bold mb-1">{tier.tier_name || tier.tierName || '-'}</div>
                  <div className="text-sm mb-1">Commission: {tier.commission_percent || tier.commissionPercent || '-'}%</div>
                  <div className="text-sm mb-1">Min Sales: {tier.min_sales || tier.minSales || '-'}</div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditTier({ ...tier })}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                      aria-label="Edit"
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteId(tier.id)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {/* Table View for md+ screens */}
            <div className="hidden md:block">
              <table className="min-w-full table-auto border-separate border-spacing-y-2">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-foreground">Tier Name</th>
                    <th className="text-left px-4 py-2 font-semibold text-foreground">Commission (%)</th>
                    <th className="text-left px-4 py-2 font-semibold text-foreground">Min Sales</th>
                    <th className="text-right px-4 py-2 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((tier: any) => (
                    <tr key={tier.id} className="bg-muted/50 hover:bg-muted rounded-lg">
                      <td className="px-4 py-3 rounded-l-lg text-foreground">{tier.tier_name || tier.tierName || '-'}</td>
                      <td className="px-4 py-3 text-foreground">{tier.commission_percent || tier.commissionPercent || '-'}%</td>
                      <td className="px-4 py-3 text-foreground">{tier.min_sales || tier.minSales || '-'}</td>
                      <td className="px-4 py-3 text-right rounded-r-lg">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditTier({ ...tier })}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                            aria-label="Edit"
                          >
                            <Pencil className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(tier.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTier} onOpenChange={(open) => !open && setEditTier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Commission Tier</DialogTitle>
          </DialogHeader>
          {editTier && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editTierName">Tier Name</Label>
                <Input
                  id="editTierName"
                  name="tier_name"
                  value={editTier.tier_name}
                  onChange={e => setEditTier({ ...editTier, tier_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCommissionPercent">Commission Rate (%)</Label>
                <Input
                  id="editCommissionPercent"
                  name="commission_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={editTier.commission_percent}
                  onChange={e => setEditTier({ ...editTier, commission_percent: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMinSales">Min Sales</Label>
                <Input
                  id="editMinSales"
                  name="min_sales"
                  type="number"
                  min="0"
                  value={editTier.min_sales}
                  onChange={e => setEditTier({ ...editTier, min_sales: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setEditTier(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tier</DialogTitle>
            <DialogDescription>Are you sure you want to delete this tier?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}