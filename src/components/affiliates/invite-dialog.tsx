import React, { useState, useEffect } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { apiProducts, api } from '@/lib/api';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface InviteDialogProps {
  trigger?: React.ReactNode;
}

export function InviteDialog({ trigger }: InviteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productCommissionSettings, setProductCommissionSettings] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const queryClient = useQueryClient();

  // Debug message state changes
  useEffect(() => {
    console.log('Message state updated:', message);
  }, [message]);

  // Auto-hide message after 5 seconds
  useEffect(() => {
    if (message) {
      console.log('Setting up auto-hide timer for message:', message);
      const timer = setTimeout(() => {
        console.log('Auto-hiding message');
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
      console.log('Sending invite with data:', data);
      const response = await api.post('/api/affiliates/invite', data);
      console.log('Invite response:', response);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Invite sent successfully:', data);
      // Set message first
      setMessage({
        type: 'success',
        text: `Invitation sent successfully to ${email}`
      });
      
      // Then update other state
      setTimeout(() => {
        setIsOpen(false);
        setEmail('');
        setSelectedProducts([]);
        setProductCommissionSettings({});
        queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      }, 1000); // Small delay to ensure message is shown
    },
    onError: (error: any) => {
      console.error('Error sending invite:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send invitation. Please try again.'
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || selectedProducts.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please enter an email and select at least one product.'
      });
      return;
    }
    
    try {
      console.log('Submitting invite form:', {
        email,
        selectedProducts,
        productCommissionSettings
      });
      
      await inviteMutation.mutateAsync({ 
        email, 
        productIds: selectedProducts, 
        productCommissionSettings 
      });
    } catch (error) {
      // Error is handled by onError callback
      console.error('Error in handleSubmit:', error);
    }
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

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

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