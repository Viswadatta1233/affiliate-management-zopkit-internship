import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';

const profileSchema = z.object({
  currentPassword: z.string().min(8, 'Password must be at least 8 characters'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  companyName: z.string().optional(),
  websiteUrl: z.string().url('Please enter a valid URL').optional(),
  taxId: z.string().optional(),
  paymentThreshold: z.number().min(0).optional(),
  preferredCurrency: z.string().length(3).optional(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof profileSchema>;

export default function CompleteAffiliateProfile() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      companyName: '',
      websiteUrl: '',
      taxId: '',
      paymentThreshold: 50,
      preferredCurrency: 'USD'
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // First change the password
      await api.post('/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      // Then update the affiliate profile
      await api.put('/api/affiliates/profile', {
        companyName: data.companyName,
        websiteUrl: data.websiteUrl,
        taxId: data.taxId,
        paymentThreshold: data.paymentThreshold,
        preferredCurrency: data.preferredCurrency
      });

      toast.success('Profile updated successfully', {
        description: 'Your password has been changed and profile has been completed.'
      });

      // Redirect to dashboard
      navigate('/');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Affiliate Profile</CardTitle>
          <CardDescription>
            Please change your temporary password and provide additional information to complete your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...form.register('currentPassword')}
                />
                {form.formState.errors.currentPassword && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...form.register('newPassword')}
                />
                {form.formState.errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...form.register('confirmPassword')}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="companyName">Company Name (Optional)</Label>
                <Input
                  id="companyName"
                  {...form.register('companyName')}
                />
              </div>

              <div>
                <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  {...form.register('websiteUrl')}
                />
                {form.formState.errors.websiteUrl && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.websiteUrl.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="taxId">Tax ID (Optional)</Label>
                <Input
                  id="taxId"
                  {...form.register('taxId')}
                />
              </div>

              <div>
                <Label htmlFor="paymentThreshold">Payment Threshold (Optional)</Label>
                <Input
                  id="paymentThreshold"
                  type="number"
                  {...form.register('paymentThreshold', { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="preferredCurrency">Preferred Currency</Label>
                <Input
                  id="preferredCurrency"
                  {...form.register('preferredCurrency')}
                  defaultValue="USD"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating Profile...' : 'Complete Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 