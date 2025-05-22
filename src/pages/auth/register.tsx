import React from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { RegisterForm } from '@/components/auth/register-form';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/theme/mode-toggle';

const Register: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenant') || 'default-tenant-id';

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-4 lg:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-bold">Affiliate Platform</span>
        </Link>
        <ModeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Create an Account</h1>
            <p className="text-muted-foreground">
              Fill in the form below to create your account
            </p>
          </div>
          <div className="space-y-4">
            <RegisterForm tenantId={tenantId} />
            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="underline underline-offset-4 hover:text-primary">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row md:py-0">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Affiliate Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/settings/general">Terms</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/settings/general">Privacy</Link>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Register;