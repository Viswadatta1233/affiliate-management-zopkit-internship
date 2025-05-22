import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trackingLinkSchema } from '@/lib/validations/affiliate';
import { useAuthStore } from '@/store/auth-store';
import { useAffiliateStore } from '@/store/affiliate-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Medium options for tracking links
const mediumOptions = [
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social Media' },
  { value: 'banner', label: 'Banner Ad' },
  { value: 'blog', label: 'Blog Post' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

type FormData = z.infer<typeof trackingLinkSchema>;

interface TrackingLinkFormProps {
  onSuccess?: () => void;
  editLink?: any; // The tracking link to edit, if any
}

export function TrackingLinkForm({ onSuccess, editLink }: TrackingLinkFormProps) {
  const { user, tenant } = useAuthStore();
  const { currentAffiliate, createTrackingLink, updateTrackingLink, isLoading, error } = useAffiliateStore();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(trackingLinkSchema),
    defaultValues: {
      destination_url: editLink?.destination_url || '',
      campaign_name: editLink?.campaign_name || '',
      utm_medium: editLink?.utm_medium || 'email',
      utm_campaign: editLink?.utm_campaign || '',
      utm_content: editLink?.utm_content || '',
      utm_term: editLink?.utm_term || '',
      expires_at: editLink?.expires_at ? new Date(editLink.expires_at) : null,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user || !tenant || !currentAffiliate) {
      toast({
        title: 'Error',
        description: 'User or affiliate information not found.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const linkData = {
        ...data,
        tenant_id: tenant.id,
        affiliate_id: currentAffiliate.id,
        utm_source: currentAffiliate.referralCode,
      };

      if (editLink) {
        await updateTrackingLink(editLink.id, linkData);
        toast({
          title: 'Success',
          description: 'Tracking link updated successfully.',
        });
      } else {
        await createTrackingLink(linkData);
        toast({
          title: 'Success',
          description: 'Tracking link created successfully.',
        });
      }

      if (onSuccess) {
        onSuccess();
      }

      // Reset the form if creating a new link
      if (!editLink) {
        form.reset({
          destination_url: '',
          campaign_name: '',
          utm_medium: 'email',
          utm_campaign: '',
          utm_content: '',
          utm_term: '',
          expires_at: null,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: error || 'An error occurred while saving the tracking link.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="destination_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination URL</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/product"
                  disabled={isLoading}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Enter the full URL where visitors will be directed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="campaign_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Summer Sale 2025"
                  disabled={isLoading}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Give this campaign a descriptive name for tracking purposes.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="utm_medium"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marketing Medium</FormLabel>
              <Select
                disabled={isLoading}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marketing medium" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mediumOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The marketing medium through which your link will be shared.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="utm_campaign"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign ID (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="summer_2025"
                    disabled={isLoading}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Identifier for tracking specific campaign analytics.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="utm_content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="banner_blue"
                    disabled={isLoading}
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  Differentiate similar content within the same ad.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="utm_term"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keywords (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="running,shoes,discount"
                  disabled={isLoading}
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Identify paid search keywords for this link.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="expires_at"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Expiration Date (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Set an optional expiration date for this tracking link.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            disabled={isLoading}
            onClick={() => {
              if (onSuccess) onSuccess();
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? (editLink ? 'Updating...' : 'Creating...') : (editLink ? 'Update Link' : 'Create Link')}
          </Button>
        </div>
      </form>
    </Form>
  );
}