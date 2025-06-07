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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type FormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

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
      
      // Get fresh state
      const { user, role, error: loginError } = useAuthStore.getState();
      
      if (loginError) {
        toast({
          title: 'Login Failed',
          description: loginError,
          variant: 'destructive',
        });
        return;
      }

      // Check for super admin credentials
      if (data.email === 'zopkit@gmail.com' && data.password === 'zopkit123') {
        navigate('/super-admin/dashboard');
        toast({
          title: 'Welcome Super Admin!',
          description: 'You have successfully logged in with super admin privileges.',
        });
        return;
      }

      // Handle role-based redirection
      if (role?.roleName === 'influencer' || role?.roleName === 'potential_influencer') {
        navigate('/influencer/dashboard');
        toast({
          title: 'Welcome!',
          description: 'You have successfully logged in to your influencer dashboard.',
        });
      } else if (user?.isAffiliate) {
        navigate('/affiliate/dashboard');
        toast({
          title: 'Welcome!',
          description: 'You have successfully logged in to your affiliate dashboard.',
        });
      } else {
        navigate('/');
        toast({
          title: 'Welcome!',
          description: 'You have successfully logged in.',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while logging in.';
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsResettingPassword(true);
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your email for password reset instructions.',
      });
    } catch (err) {
      toast({
        title: 'Password Reset Failed',
        description: 'Failed to send password reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
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
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" className="px-0" type="button">
                Forgot password?
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  Enter your email address and we'll send you instructions to reset your password.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isResettingPassword}
                />
                <Button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isResettingPassword}
                  className="w-full"
                >
                  {isResettingPassword ? 'Sending...' : 'Send Reset Instructions'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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