import React, { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { apiCampaigns } from '@/lib/api';
import { NICHE_OPTIONS, AGE_GROUP_OPTIONS } from '@/lib/constants';

const influencerNiches = [
  'Fashion',
  'Beauty',
  'Fitness',
  'Food',
  'Travel',
  'Technology',
  'Gaming',
  'Lifestyle',
  'Business',
  'Education',
  'Entertainment',
  'Sports',
  'Health',
  'Art',
  'Music'
];

const socialMediaPlatforms = [
  'Instagram',
  'YouTube',
  'TikTok',
  'Facebook',
  'Twitter',
  'LinkedIn',
  'Pinterest',
  'Snapchat'
];

// Campaign schema matching the backend
const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().min(1, 'Description is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  type: z.string().min(1, 'Campaign type is required'),
  targetAudienceAgeGroup: z.enum(AGE_GROUP_OPTIONS.map(a => a.value) as [string, ...string[]], {
    required_error: "Please select target audience age group",
  }),
  requiredInfluencerNiche: z.enum(NICHE_OPTIONS.map(n => n.value) as [string, ...string[]], {
    required_error: "Please select required influencer niche",
  }),
  basicGuidelines: z.string().min(1, 'Basic guidelines are required'),
  preferredSocialMedia: z.string().min(1, 'Preferred social media platform is required'),
  marketingObjective: z.string().min(1, 'Marketing objective is required'),
  commissionRate: z.string().min(1, 'Commission rate is required'),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      type: '',
      targetAudienceAgeGroup: '',
      requiredInfluencerNiche: '',
      basicGuidelines: '',
      preferredSocialMedia: '',
      marketingObjective: '',
      commissionRate: ''
    }
  });

  const onSubmit = async (data: CampaignFormValues) => {
    try {
      if (!token) {
        toast.error('You must be logged in to create a campaign');
        navigate('/login');
        return;
      }

      console.log('Submitting campaign data:', data);
      const dataToSend = { ...data, commissionRate: parseFloat(data.commissionRate) };
      await apiCampaigns.create(dataToSend);
      toast.success('Campaign created successfully');
      navigate('/marketing/campaigns');
    } catch (error) {
      console.error('Error creating campaign:', error);
      console.error('Campaign creation failed with data:', data);
      toast.error(error instanceof Error ? error.message : 'Failed to create campaign');
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
  return (
          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-lg font-semibold text-primary bg-gray-50 px-3 py-1 rounded mb-2">Campaign Basics</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Name</FormLabel>
                      <FormControl>
                      <Input placeholder="Enter campaign name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                name="type"
                  render={({ field }) => (
                    <FormItem>
                    <FormLabel>Campaign Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>End Date</FormLabel>
                        <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="commissionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="Enter commission rate" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
          </fieldset>
        );
      case 2:
        return (
          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-lg font-semibold text-primary bg-gray-50 px-3 py-1 rounded mb-2">Demographics</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="targetAudienceAgeGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience Age Group</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select age group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AGE_GROUP_OPTIONS.map((ageGroup) => (
                          <SelectItem key={ageGroup.value} value={ageGroup.value}>
                            {ageGroup.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="requiredInfluencerNiche"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Influencer Niche</FormLabel>
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
                <FormField
                  control={form.control}
                name="preferredSocialMedia"
                  render={({ field }) => (
                    <FormItem>
                    <FormLabel>Preferred Social Media Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {socialMediaPlatforms.map((platform) => (
                          <SelectItem key={platform} value={platform}>
                            {platform}
                          </SelectItem>
                        ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
          </fieldset>
        );
      case 3:
        return (
          <fieldset className="border border-gray-200 rounded-lg p-4">
            <legend className="text-lg font-semibold text-primary bg-gray-50 px-3 py-1 rounded mb-2">Guidelines & Objectives</legend>
            <div className="grid grid-cols-1 gap-3">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter campaign description" className="h-20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="basicGuidelines"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Basic Guidelines</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter basic guidelines" className="h-20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="marketingObjective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marketing Objective</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter marketing objective" className="h-20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </fieldset>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Create New Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {renderStep()}
              
              <div className="flex justify-between pt-2">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}
                {currentStep < 3 ? (
                  <Button type="button" onClick={nextStep} className="ml-auto">
                    Next
                  </Button>
                ) : (
                  <Button type="submit" className="ml-auto">
                    Create Campaign
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
