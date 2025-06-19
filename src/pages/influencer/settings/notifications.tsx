import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';

const notificationSchema = z.object({
  allowNotificationForCampaign: z.boolean(),
  allowNotificationForApproval: z.boolean(),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

// SettingsTabs component for navigation
function SettingsTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = [
    { label: 'Update Profile', path: '/influencer/settings/profile' },
    { label: 'Notifications', path: '/influencer/settings/notifications' },
    { label: 'Change Password', path: '/influencer/settings/security' },
  ];
  return (
    <div className="flex gap-4 mb-6 border-b">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          className={`pb-2 px-2 text-lg font-medium border-b-2 transition-colors duration-150 ${location.pathname === tab.path ? 'border-teal-500 text-teal-600' : 'border-transparent text-muted-foreground hover:text-teal-600'}`}
          onClick={() => navigate(tab.path)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function InfluencerSettingsNotifications() {
  const { user } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
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
    setLoading(true);
    try {
      await api.patch('/influencers/notifications', values);
      toast.success('Notification preferences updated');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Notification Preferences</h1>
        <p className="text-gray-600">Manage how and when you receive notifications</p>
      </div>
      
      <SettingsTabs />
      
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-xl text-gray-800">Email Notifications</CardTitle>
            <CardDescription>Configure which emails you'd like to receive</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="allowNotificationForCampaign"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-teal-100">
                              <Bell className="h-5 w-5 text-teal-500" />
                            </div>
                            <FormLabel className="text-base font-medium text-gray-800">Campaign Notifications</FormLabel>
                          </div>
                          <FormDescription className="text-sm text-gray-600">
                            Receive email notifications when a campaign matching your niche is created
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                            className="data-[state=checked]:bg-teal-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="allowNotificationForApproval"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-gray-50">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-full bg-teal-100">
                              <CheckCircle2 className="h-5 w-5 text-teal-500" />
                            </div>
                            <FormLabel className="text-base font-medium text-gray-800">Status Updates</FormLabel>
                          </div>
                          <FormDescription className="text-sm text-gray-600">
                            Receive email when your account status is updated from 'potential_influencer' to 'influencer'
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange} 
                            className="data-[state=checked]:bg-teal-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-teal-500 hover:bg-teal-600"
                  >
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-md">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-xl text-gray-800">In-App Notifications</CardTitle>
            <CardDescription>Configure your in-app notification settings</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-6 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p>In-app notification preferences coming soon!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 