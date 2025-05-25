import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Send, Plus, Trash } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAffiliateStore } from '@/store/affiliate-store';
import { useProductStore } from '@/store/product-store';
import { Product } from '@/types';

interface ProductCommission {
  productId: string;
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
}

export default function InviteAffiliate() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [initialTier, setInitialTier] = useState('');
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [productCommissions, setProductCommissions] = useState<ProductCommission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  
  const { inviteAffiliate } = useAffiliateStore();
  const { products, fetchProducts } = useProductStore();
  
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (firstName && firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    
    if (lastName && lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    
    if (commissionRate < 0 || commissionRate > 100) {
      newErrors.commissionRate = 'Commission rate must be between 0 and 100';
    }

    productCommissions.forEach((commission, index) => {
      if (commission.commissionRate < 0 || commission.commissionRate > 100) {
        newErrors[`productCommission${index}`] = 'Commission rate must be between 0 and 100';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 ? {} : newErrors;
  };

  const addProductCommission = () => {
    setProductCommissions([
      ...productCommissions,
      {
        productId: '',
        commissionRate: 10,
        commissionType: 'percentage'
      }
    ]);
  };

  const removeProductCommission = (index: number) => {
    setProductCommissions(productCommissions.filter((_, i) => i !== index));
  };

  const updateProductCommission = (index: number, field: keyof ProductCommission, value: string | number) => {
    const updatedCommissions = [...productCommissions];
    updatedCommissions[index] = {
      ...updatedCommissions[index],
      [field]: field === 'commissionRate' ? parseFloat(value as string) : value
    };
    setProductCommissions(updatedCommissions);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsSubmitting(false);
        return;
      }

      const data = {
        email,
        firstName,
        lastName,
        initialTier: initialTier || undefined,
        commissionRate: parseFloat(commissionRate.toString()),
        productCommissions: productCommissions.length > 0 ? productCommissions : undefined
      };

      console.log('Submitting invite form with data:', data);
      const response = await inviteAffiliate(data);
      
      if (response.message.includes('converted')) {
        toast.success('User converted to affiliate', {
          description: `Existing user ${email} has been converted to an affiliate.`
        });
      } else {
        toast.success('Invitation sent', {
          description: `An email with login credentials has been sent to ${email}.`
        });
      }

      // Reset form
      setEmail('');
      setFirstName('');
      setLastName('');
      setInitialTier('');
      setCommissionRate(10);
      setProductCommissions([]);
      setErrors({});
    } catch (error) {
      console.error('Error submitting invite form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
      setError(errorMessage);
      
      if (errorMessage.includes('already an affiliate')) {
        toast.error('Already an affiliate', {
          description: 'This email address is already registered as an affiliate.'
        });
      } else {
        toast.error('Failed to send invitation', {
          description: errorMessage
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invite Affiliate</h1>
          <p className="text-muted-foreground">Send an invitation to a new affiliate partner</p>
        </div>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite New Affiliate
          </CardTitle>
          <CardDescription>
            Fill in the details below to send an invitation email to a potential affiliate partner.
            They'll receive login credentials and instructions to join your affiliate program.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address*</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="affiliate@example.com"
                  required
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>
              
              <div>
                <Label htmlFor="initialTier">Initial Tier</Label>
                <Select value={initialTier} onValueChange={setInitialTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select initial tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="commissionRate">Default Commission Rate (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                />
                {errors.commissionRate && <p className="text-red-500 text-sm mt-1">{errors.commissionRate}</p>}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Product-Specific Commission Rates</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addProductCommission}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </div>

                {productCommissions.map((commission, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-start border p-4 rounded-lg">
                    <div className="col-span-5">
                      <Label>Product</Label>
                      <Select
                        value={commission.productId}
                        onValueChange={(value) => updateProductCommission(index, 'productId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label>Commission Type</Label>
                      <Select
                        value={commission.commissionType}
                        onValueChange={(value) => updateProductCommission(index, 'commissionType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-3">
                      <Label>Rate</Label>
                      <Input
                        type="number"
                        value={commission.commissionRate}
                        onChange={(e) => updateProductCommission(index, 'commissionRate', e.target.value)}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      {errors[`productCommission${index}`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`productCommission${index}`]}</p>
                      )}
                    </div>

                    <div className="col-span-1 pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeProductCommission(index)}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 