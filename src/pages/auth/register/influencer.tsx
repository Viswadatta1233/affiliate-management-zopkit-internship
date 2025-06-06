import React from 'react';
import { Link } from 'react-router-dom';
import { InfluencerRegistrationForm } from '@/components/auth/influencer-registration-form';
import { ModeToggle } from '@/components/theme/mode-toggle';

const InfluencerRegistration: React.FC = () => {
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
            <h1 className="text-3xl font-bold">Join as Influencer</h1>
            <p className="text-muted-foreground">
              Create your influencer account to start collaborating with brands
            </p>
          </div>
          <InfluencerRegistrationForm />
          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="underline underline-offset-4 hover:text-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row md:py-0">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Affiliate Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary">
              Terms
            </Link>
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InfluencerRegistration; 