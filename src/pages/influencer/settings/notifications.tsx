import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/axios';
import { toast } from 'sonner';

const notificationSchema = z.object({
  allowNotificationForCampaign: z.boolean(),
  allowNotificationForApproval: z.boolean(),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function InfluencerSettingsNotifications() {
  const { user } = useAuthStore();
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      allowNotificationForCampaign: true,
      allowNotificationForApproval: true,
    },
  });

  useEffect(() => {
    async function fetchPreferences() {
      if (!user) return;
      try {
        const { data } = await api.get(`/influencers/notifications`);
        form.reset({
          allowNotificationForCampaign: data.allowNotificationForCampaign,
          allowNotificationForApproval: data.allowNotificationForApproval,
        });
      } catch (e) {
        toast.error('Could not load notification preferences');
      }
    }
    fetchPreferences();
    // eslint-disable-next-line
  }, [user]);

  const onSubmit = async (values: NotificationFormValues) => {
    try {
      await api.patch('/influencers/notifications', values);
      toast.success('Notification preferences updated');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to update preferences');
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Notification Preferences</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="allowNotificationForCampaign"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div>
                    <FormLabel>Email me when a campaign of my niche is created</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allowNotificationForApproval"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <div>
                    <FormLabel>Email me when my status gets updated from 'potential_influencer' to influencer role</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit">Save Preferences</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
} 