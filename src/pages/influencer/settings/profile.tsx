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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Update Profile</h1>
        <p className="text-gray-600">Manage your personal information and account details</p>
      </div>
      <SettingsTabs />
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        {initialLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-teal-500 border-gray-200 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your profile...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">First Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" 
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" 
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        {...field} 
                        className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Phone</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Country</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" 
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="niche"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Niche</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-teal-500 focus:ring-teal-500">
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
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={3} 
                        {...field} 
                        className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" 
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Social Media Profiles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="socialMedia.instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Instagram</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://instagram.com/yourusername" 
                            {...field} 
                            className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" 
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="socialMedia.youtube"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">YouTube</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://youtube.com/c/yourchannel" 
                            {...field} 
                            className="border-gray-300 focus:border-teal-500 focus:ring-teal-500" 
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-teal-500 hover:bg-teal-600"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
} 