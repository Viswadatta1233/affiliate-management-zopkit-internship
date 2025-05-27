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

interface InviteDialogProps {
  trigger?: React.ReactNode;
}

export function InviteDialog({ trigger }: InviteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [productId, setProductId] = useState('');
  const [addProductCommission, setAddProductCommission] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await apiProducts.getAll()).data,
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; productId: string; addProductCommission: boolean }) => {
      return api.post('/api/affiliates/invite', data);
    },
    onSuccess: () => {
      toast({ title: 'Invitation sent successfully' });
      setIsOpen(false);
      setEmail('');
      setProductId('');
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
    if (!email || !productId) return;
    inviteMutation.mutate({ email, productId, addProductCommission });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Invite Affiliate</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Affiliate</DialogTitle>
          <DialogDescription>
            Send an invitation to join your affiliate program.
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
            <label className="text-sm font-medium">Product</label>
            <Select value={productId} onValueChange={setProductId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingProducts ? (
                  <SelectItem value="loading" disabled>
                    Loading products...
                  </SelectItem>
                ) : (
                  products?.map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.commission_percent}% commission)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <input
                type="checkbox"
                checked={addProductCommission}
                onChange={e => setAddProductCommission(e.target.checked)}
                className="mr-2"
              />
              Add Product Commission
            </label>
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
              disabled={inviteMutation.isPending || !email || !productId}
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 