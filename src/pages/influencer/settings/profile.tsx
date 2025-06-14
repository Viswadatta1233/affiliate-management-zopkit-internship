import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/store/auth-store';
import { NICHE_OPTIONS } from '@/lib/constants';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useLocation, useNavigate } from 'react-router-dom';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  niche: z.string().min(1, 'Niche is required'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  socialMedia: z.object({
    instagram: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
    youtube: z.string().url('Invalid YouTube URL').optional().or(z.literal('')),
  }).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// SettingsTabs component for navigation
function SettingsTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = [
    { label: 'Update Profile', path: '/influencer/settings/profile' },
    { label: 'Change Password', path: '/influencer/settings/security' },
  ];
  return (
    <div className="flex gap-4 mb-6 border-b">
      {tabs.map((tab) => (
        <button
          key={tab.path}
          className={`pb-2 px-2 text-lg font-medium border-b-2 transition-colors duration-150 ${location.pathname === tab.path ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-primary'}`}
          onClick={() => navigate(tab.path)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function InfluencerSettingsProfile() {
  const { user, loadUserData } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      country: '',
      niche: '',
      bio: '',
      socialMedia: { instagram: '', youtube: '' },
    },
  });

  // Fetch influencer profile on mount
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      setInitialLoading(true);
      try {
        const { data } = await api.get(`/influencers/profile/${user.id}`);
        form.reset({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          country: data.country || '',
          niche: data.niche || '',
          bio: data.bio || '',
          socialMedia: {
            instagram: data.socialMedia?.instagram || '',
            youtube: data.socialMedia?.youtube || '',
          },
        });
      } catch (e) {
        toast.error('Could not load profile');
      } finally {
        setInitialLoading(false);
      }
    }
    fetchProfile();
    // eslint-disable-next-line
  }, [user]);

  const onSubmit = async (values: ProfileFormValues) => {
    setLoading(true);
    try {
      await api.patch('/influencers/profile', values);
      // Reload user data to update the store and local storage
      await loadUserData();
      toast.success('Profile updated successfully');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Update Profile</h1>
      <SettingsTabs />
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
        {initialLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Niche</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select niche" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {NICHE_OPTIONS.map((niche) => (
                            <SelectItem key={niche.value} value={niche.value}>
                              {niche.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="socialMedia.instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/yourusername" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="socialMedia.youtube"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube</FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtube.com/yourchannel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
} 