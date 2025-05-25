import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { AlertCircle } from 'lucide-react';

type FormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showTenantField, setShowTenantField] = useState(false);

  // Get URL parameters for invited affiliates
  const [searchParams] = useSearchParams();
  const isInvited = searchParams.get('invited') === 'true';
  const invitedEmail = searchParams.get('email');

  // Move subdomain check to component level
  const subdomain = window.location.hostname.split('.')[0];
  const isCustomSubdomain = subdomain !== 'localhost' && subdomain !== 'affiliate-platform';

  const form = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: invitedEmail || localStorage.getItem('lastEmail') || '',
      password: '',
      remember: false,
      tenant: isCustomSubdomain ? subdomain : ''
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      clearError();
      const response = await login({
        ...data,
        tenant: isCustomSubdomain ? subdomain : (showTenantField ? data.tenant : undefined),
      });

      if (response.success) {
        if (data.remember) {
          localStorage.setItem('lastEmail', data.email);
        } else {
          localStorage.removeItem('lastEmail');
        }

        // If this is an invited affiliate, redirect to profile completion
        if (isInvited) {
          navigate('/affiliates/profile/complete');
          toast({
            title: "Welcome!",
            description: "Please complete your affiliate profile to continue.",
          });
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // If error indicates tenant is required, show the tenant field
      if (err instanceof Error && err.message.includes('tenant')) {
        setShowTenantField(true);
      }
      
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err instanceof Error ? err.message : "An error occurred during login",
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

        {(!isCustomSubdomain && showTenantField) && (
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="tenant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant Subdomain (Optional)</FormLabel>
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground"
              onClick={() => setShowTenantField(false)}
            >
              Hide tenant field
            </Button>
          </div>
        )}

        {!isCustomSubdomain && !showTenantField && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-sm text-muted-foreground"
            onClick={() => setShowTenantField(true)}
          >
            Use specific tenant subdomain
          </Button>
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

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

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