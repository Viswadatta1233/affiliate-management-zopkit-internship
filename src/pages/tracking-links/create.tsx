import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrackingLinkForm } from '@/components/affiliate/tracking-link-form';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CreateTrackingLink() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate back to tracking links list after successful creation
    navigate('/tracking-links');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="mb-4">
        <Button 
          variant="outline" 
          size="lg" 
          className="flex items-center gap-2" 
          onClick={() => navigate('/tracking-links')}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Tracking Links</span>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create Tracking Link</CardTitle>
          <CardDescription>
            Create a new tracking link to promote products and earn commissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrackingLinkForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
} 