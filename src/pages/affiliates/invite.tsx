import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Send } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAffiliateStore } from '@/store/affiliate-store';

export default function InviteAffiliate() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [initialTier, setInitialTier] = useState('');
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  
  const { inviteAffiliate } = useAffiliateStore();
  
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 ? {} : newErrors;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate form
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
        commissionRate: parseFloat(commissionRate.toString())
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
                <Label htmlFor="email" className={`text-base ${errors.email ? 'text-red-500' : ''}`}>
                  Email Address*
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="affiliate@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: '' });
                    }
                  }}
                  required
                  className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className={`text-base ${errors.firstName ? 'text-red-500' : ''}`}>
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName) {
                        setErrors({ ...errors, firstName: '' });
                      }
                    }}
                    className={`mt-1 ${errors.firstName ? 'border-red-500' : ''}`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className={`text-base ${errors.lastName ? 'text-red-500' : ''}`}>
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName) {
                        setErrors({ ...errors, lastName: '' });
                      }
                    }}
                    className={`mt-1 ${errors.lastName ? 'border-red-500' : ''}`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="tier" className="text-base">Initial Tier</Label>
                <Select value={initialTier} onValueChange={setInitialTier}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="commission" className={`text-base ${errors.commissionRate ? 'text-red-500' : ''}`}>
                  Commission Rate (%)
                </Label>
                <Input
                  id="commission"
                  type="number"
                  placeholder="10"
                  min="0"
                  max="100"
                  value={commissionRate}
                  onChange={(e) => {
                    setCommissionRate(Number(e.target.value));
                    if (errors.commissionRate) {
                      setErrors({ ...errors, commissionRate: '' });
                    }
                  }}
                  className={`mt-1 ${errors.commissionRate ? 'border-red-500' : ''}`}
                />
                {errors.commissionRate && (
                  <p className="mt-1 text-sm text-red-500">{errors.commissionRate}</p>
                )}
              </div>
            </div>
            
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>Sending Invitation...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 