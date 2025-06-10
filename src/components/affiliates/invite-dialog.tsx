import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiProducts, api } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface InviteDialogProps {
  trigger?: React.ReactNode;
}

export function InviteDialog({ trigger }: InviteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productCommissionSettings, setProductCommissionSettings] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await apiProducts.getAll()).data,
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: { 
      email: string; 
      productIds: string[]; 
      productCommissionSettings: Record<string, boolean>;
    }) => {
      return api.post('/api/affiliates/invite', data);
    },
    onSuccess: () => {
      toast({ title: 'Invitation sent successfully' });
      setIsOpen(false);
      setEmail('');
      setSelectedProducts([]);
      setProductCommissionSettings({});
      queryClient.invalidateQueries({ queryKey: ['affiliates'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error sending invite',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || selectedProducts.length === 0) return;
    inviteMutation.mutate({ 
      email, 
      productIds: selectedProducts, 
      productCommissionSettings 
    });
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSelected = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      // Remove commission setting when product is deselected
      if (!newSelected.includes(productId)) {
        setProductCommissionSettings(prev => {
          const { [productId]: _, ...rest } = prev;
          return rest;
        });
      }
      
      return newSelected;
    });
  };

  const toggleProductCommission = (productId: string, checked: boolean) => {
    setProductCommissionSettings(prev => ({
      ...prev,
      [productId]: checked
    }));
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(id => id !== productId));
    setProductCommissionSettings(prev => {
      const { [productId]: _, ...rest } = prev;
      return rest;
    });
  };

  const selectAllProducts = () => {
    if (products) {
      setSelectedProducts(products.map((p: any) => p.id));
    }
  };

  const clearSelection = () => {
    setSelectedProducts([]);
    setProductCommissionSettings({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Invite Affiliate</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite Affiliate</DialogTitle>
          <DialogDescription>
            Send an invitation to join your affiliate program. Select one or more products.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Products</label>
              <div className="space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllProducts}>
                  Select All
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
              {isLoadingProducts ? (
                <div className="text-sm text-muted-foreground">Loading products...</div>
              ) : (
                products?.map((product: any) => (
                  <div key={product.id} className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 flex-1">
                      <Checkbox
                        id={product.id}
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                      <label htmlFor={product.id} className="text-sm flex-1">
                        {product.name} ({product.commission_percent}% commission)
                      </label>
                    </div>
                    {selectedProducts.includes(product.id) && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`commission-${product.id}`}
                          checked={productCommissionSettings[product.id] || false}
                          onCheckedChange={(checked) => toggleProductCommission(product.id, checked as boolean)}
                        />
                        <label htmlFor={`commission-${product.id}`} className="text-sm text-muted-foreground">
                          Use product commission as default
                        </label>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {selectedProducts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedProducts.map(productId => {
                  const product = products?.find((p: any) => p.id === productId);
                  return product ? (
                    <Badge key={productId} variant="secondary" className="flex items-center gap-1">
                      {product.name}
                      <button
                        type="button"
                        onClick={() => removeProduct(productId)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={inviteMutation.isPending || !email || selectedProducts.length === 0}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 