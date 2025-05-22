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

export default function ProductCommissions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [commissionRate, setCommissionRate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle commission rule creation
    console.log('Creating commission rule:', { productId, commissionRate });
    setIsDialogOpen(false);
    setProductId('');
    setCommissionRate('');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Commissions</h1>
          <p className="text-muted-foreground">Manage product-specific commission rules</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Commission Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Commission Rule</DialogTitle>
              <DialogDescription>
                Set up commission rules for specific products.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Product ID</Label>
                <Input
                  id="productId"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="Enter product ID"
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
                <Button type="submit">Create Rule</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Rules</CardTitle>
          <CardDescription>Product-specific commission configurations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Configure your product commission rules here. This feature is coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}