import React, { useState } from 'react';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { NICHE_OPTIONS } from '@/lib/constants';
import { Eye, EyeOff } from 'lucide-react';

const influencerFormSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  instagram: z.string().url('Invalid Instagram URL').optional(),
  youtube: z.string().url('Invalid YouTube URL').optional(),
  niche: z.enum(NICHE_OPTIONS.map(n => n.value) as [string, ...string[]], {
    required_error: "Please select your niche",
  }),
  country: z.string().min(1, 'Please select a country'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type InfluencerFormValues = z.infer<typeof influencerFormSchema>;

const countries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'India',
  'Germany',
  'France',
  'Japan',
  'Brazil',
  'Other',
];

export function InfluencerRegistrationForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setInfluencerAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const form = useForm<InfluencerFormValues>({
    resolver: zodResolver(influencerFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      instagram: '',
      youtube: '',
      niche: '',
      country: '',
      bio: '',
      agreedToTerms: false,
    },
  });

  async function onSubmit(data: InfluencerFormValues) {
    try {
      console.log('Submitting registration form:', data);

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/api/influencers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
          phone: data.phone,
          social_links: {
            instagram: data.instagram,
            youtube: data.youtube,
          },
          niche: data.niche,
          country: data.country,
          bio: data.bio,
          agreedToTerms: data.agreedToTerms,
        }),
      });

      console.log('Registration response status:', response.status);

      let responseData;
      try {
        responseData = await response.json();
        console.log('Registration response data:', responseData);
      } catch (error) {
        console.error('Error parsing response:', error);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        if (Array.isArray(responseData.error)) {
          throw new Error(responseData.error.map((err: any) => err.message).join(', '));
        }
        throw new Error(responseData?.error || 'Registration failed');
      }

      toast({
        title: 'Registration Successful',
        description: responseData.message || 'Your account is pending approval. We will notify you once approved.',
      });

      // Store the token and user data directly
      localStorage.setItem('token', responseData.token);
      localStorage.setItem('user', JSON.stringify(responseData.user));

      // Check if we have the required data in localStorage
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        // Update auth store with the registration response data
        const userData = JSON.parse(storedUser);
        setInfluencerAuth(storedToken, userData, userData.role);
        
        // Redirect immediately to influencer dashboard
        navigate('/influencer/dashboard', { replace: true });
      } else {
        throw new Error('Failed to store authentication data');
      }

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
          {/* Left Column */}
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram Profile</FormLabel>
                <FormControl>
                  <Input placeholder="https://instagram.com/yourusername" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="youtube"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YouTube Channel</FormLabel>
                <FormControl>
                  <Input placeholder="https://youtube.com/yourchannel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter your password" 
                      {...field} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
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
                      <SelectValue placeholder="Select your niche" />
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
                <FormDescription>
                  Select the primary niche you create content for
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirm your password" 
                      {...field} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
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
                <FormLabel>Country/Region</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Enter your phone number" {...field} />
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
                <FormLabel>Bio (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Tell us about yourself" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4">
          <FormField
            control={form.control}
            name="agreedToTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I agree to the terms and conditions
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full mt-8">
          Register as Influencer
        </Button>
      </form>
    </Form>
  );
} 