import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

export default function CommissionTiers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tierName, setTierName] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle tier creation
    toast({
      title: "Commission Tier Created",
      description: `Created tier "${tierName}" with ${commissionRate}% commission rate`,
    });
    
    setIsDialogOpen(false);
    setTierName('');
    setCommissionRate('');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Tiers</h1>
          <p className="text-muted-foreground">Manage commission tier structure</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Tier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Commission Tier</DialogTitle>
              <DialogDescription>
                Set up a new commission tier with specific rates and requirements.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tierName">Tier Name</Label>
                <Input
                  id="tierName"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  placeholder="e.g., Gold, Silver, Bronze"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="e.g., 10"
                  required
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Tier</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Tiers</CardTitle>
          <CardDescription>Configure tier-based commission rates</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Configure your commission tiers here. This feature is coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}