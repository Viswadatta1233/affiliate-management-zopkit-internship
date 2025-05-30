import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { apiCampaigns } from '@/lib/api';

// Campaign schema matching the backend
const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  startDate: z.date(),
  endDate: z.date().nullable(),
  type: z.enum(['product', 'service', 'event']),
  requirements: z.object({
    minFollowers: z.number().optional(),
    platforms: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
  }),
  rewards: z.object({
    commissionRate: z.number().min(0).max(100),
    bonusThreshold: z.number().optional(),
    bonusAmount: z.number().optional(),
  }),
  content: z.object({
    images: z.array(z.string()),
    videos: z.array(z.string()),
    description: z.string().min(1, 'Content description is required'),
    guidelines: z.string().min(1, 'Guidelines are required'),
    promotionalCodes: z.array(z.string()),
  }),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      type: 'product',
      requirements: {
        minFollowers: 0,
        platforms: [],
        categories: [],
      },
      rewards: {
        commissionRate: 0,
        bonusThreshold: 0,
        bonusAmount: 0,
      },
      content: {
        images: [],
        videos: [],
        promotionalCodes: [],
        description: '',
        guidelines: '',
      },
    },
  });

  const onSubmit = async (data: CampaignFormValues) => {
    try {
      if (!token) {
        toast.error('You must be logged in to create a campaign');
        navigate('/login');
        return;
      }

      console.log('Submitting campaign data:', data);
      await apiCampaigns.create(data);
      toast.success('Campaign created successfully');
      navigate('/marketing/campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
      console.error('Campaign creation failed with data:', data);
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            setDate={(date) => field.onChange(date || new Date())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value || undefined}
                            setDate={(date) => field.onChange(date)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaign type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="product">Product</SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Requirements</h3>
                <FormField
                  control={form.control}
                  name="requirements.minFollowers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Followers</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requirements.platforms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platforms</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter platforms separated by commas"
                          value={field.value?.join(', ') || ''}
                          onChange={(e) => 
                            field.onChange(e.target.value.split(',').map(p => p.trim()).filter(Boolean))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requirements.categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categories</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter categories separated by commas"
                          value={field.value?.join(', ') || ''}
                          onChange={(e) => 
                            field.onChange(e.target.value.split(',').map(c => c.trim()).filter(Boolean))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Rewards */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Rewards</h3>
                <FormField
                  control={form.control}
                  name="rewards.commissionRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rewards.bonusThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus Threshold ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rewards.bonusAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus Amount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Content</h3>
                <FormField
                  control={form.control}
                  name="content.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content.guidelines"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guidelines</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content.images"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URLs</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter image URLs separated by commas"
                          value={field.value?.join(', ') || ''}
                          onChange={(e) => 
                            field.onChange(e.target.value.split(',').map(url => url.trim()).filter(Boolean))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content.videos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URLs</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter video URLs separated by commas"
                          value={field.value?.join(', ') || ''}
                          onChange={(e) => 
                            field.onChange(e.target.value.split(',').map(url => url.trim()).filter(Boolean))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content.promotionalCodes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promotional Codes</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter promotional codes separated by commas"
                          value={field.value?.join(', ') || ''}
                          onChange={(e) => 
                            field.onChange(e.target.value.split(',').map(code => code.trim()).filter(Boolean))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full">Create Campaign</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
