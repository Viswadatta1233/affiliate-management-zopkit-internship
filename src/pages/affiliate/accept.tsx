import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuthStore();
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [inviteAccepted, setInviteAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const hasAcceptedRef = useRef<string | null>(null);

  const acceptMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await api.post('/api/affiliates/accept', { token });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Accept invite response:', data);
      if (!data || !data.credentials) {
        toast({
          title: 'Error',
          description: 'No credentials returned from server. Please contact support.',
          variant: 'destructive',
        });
        setInviteAccepted(false);
        setAcceptError('No credentials returned from server.');
        return;
      }
      setCredentials(data.credentials);
      setInviteAccepted(true);
      setAcceptError(null);
      hasAcceptedRef.current = searchParams.get('token');
    },
    onError: (error: any) => {
      let message = 'Failed to accept invite.';
      if (error instanceof Error) {
        message = error.message;
      } else if (error && error.error) {
        message = error.error;
      }
      setAcceptError(message);
      toast({
        title: 'Error accepting invite',
        description: message,
        variant: 'destructive',
      });
      hasAcceptedRef.current = searchParams.get('token');
    },
  });

  useEffect(() => {
    const token = searchParams.get('token');
    // Only call the mutation if we haven't accepted this token yet
    if (
      token &&
      !inviteAccepted &&
      !credentials &&
      hasAcceptedRef.current !== token
    ) {
      hasAcceptedRef.current = token;
      acceptMutation.mutate(token);
    }
    // eslint-disable-next-line
  }, [searchParams]);

  const handleGoToDashboard = async () => {
    if (credentials) {
      try {
        await login(credentials.email, credentials.password);
        navigate('/affiliate/dashboard');
      } catch (error) {
        toast({ title: 'Login failed', description: 'Could not log in with new credentials', variant: 'destructive' });
      }
    }
  };

  if (credentials) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to the Affiliate Program!</CardTitle>
            <CardDescription>
              Your account has been created successfully. Here are your login credentials:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <div className="mt-1 p-2 bg-muted rounded-md">{credentials.email}</div>
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <div className="mt-1 p-2 bg-muted rounded-md">{credentials.password}</div>
              </div>
              <p className="text-sm text-muted-foreground">
                Please save these credentials. You'll need them to log in to your account.
              </p>
              <Button onClick={handleGoToDashboard} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (acceptMutation.isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing your invitation...</p>
        </div>
      </div>
    );
  }

  if (acceptMutation.isError || acceptError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">{acceptError || 'Failed to accept invite. The link may be invalid or expired.'}</p>
        </div>
      </div>
    );
  }

  if (!acceptMutation.isPending && !acceptMutation.isError && !credentials && inviteAccepted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">No credentials received. Please try again or contact support.</p>
        </div>
      </div>
    );
  }

  return null;
} 