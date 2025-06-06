import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const influencerSchema = z.object({
  niche: z.string().min(1, 'Niche is required'),
  country: z.string().min(1, 'Country is required'),
  bio: z.string().min(1, 'Bio is required'),
  status: z.enum(['pending', 'active', 'inactive']),
  metrics: z.object({
    followers: z.string().min(1, 'Followers count is required'),
    engagement: z.string().min(1, 'Engagement rate is required'),
  }),
});

type InfluencerFormValues = z.infer<typeof influencerSchema>;

interface InfluencerFormProps {
  initialData?: InfluencerFormValues;
  onSubmit: (data: InfluencerFormValues) => Promise<void>;
  onCancel: () => void;
}

export function InfluencerForm({
  initialData,
  onSubmit,
  onCancel,
}: InfluencerFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<InfluencerFormValues>({
    resolver: zodResolver(influencerSchema),
    defaultValues: initialData || {
      niche: '',
      country: '',
      bio: '',
      status: 'pending',
      metrics: {
        followers: '',
        engagement: '',
      },
    },
  });

  const handleSubmit = async (data: InfluencerFormValues) => {
    try {
      setLoading(true);
      await onSubmit(data);
      toast({
        title: 'Success',
        description: initialData ? 'Influencer updated successfully' : 'Influencer created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="niche"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Niche</FormLabel>
              <FormControl>
                <Input placeholder="Enter niche" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input placeholder="Enter country" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter bio" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="metrics.followers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Followers</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter followers count" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="metrics.engagement"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Engagement Rate (%)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Enter engagement rate" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : initialData ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 