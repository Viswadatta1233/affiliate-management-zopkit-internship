import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { loginSchema } from '@/lib/validations/auth';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

type FormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Get tenant subdomain from URL if present
  const subdomain = window.location.hostname.split('.')[0];
  const isCustomSubdomain = subdomain !== 'localhost' && subdomain !== 'affiliate-platform';

  const form = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
      tenant: isCustomSubdomain ? subdomain : '',
    },
  });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await login(data.email, data.password, data.tenant);
      setTimeout(() => {
        navigate('/');
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
      }, 150); // Wait 150ms to allow Zustand persist to flush
    } catch (err) {
      toast({
        title: 'Login Failed',
        description: error || 'An error occurred while logging in.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  placeholder="your.email@example.com" 
                  type="email" 
                  autoComplete="email"
                  disabled={isLoading}
                  {...field} 
                />
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
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field} 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isCustomSubdomain && (
          <FormField
            control={form.control}
            name="tenant"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant Subdomain</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="your-company" 
                    disabled={isLoading}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal cursor-pointer">
                  Remember me
                </FormLabel>
              </FormItem>
            )}
          />
          
          <Button variant="link" className="px-0" type="button" disabled={isLoading}>
            Forgot password?
          </Button>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </Form>
  );
}