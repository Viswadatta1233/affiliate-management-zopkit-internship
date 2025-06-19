import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ChangePassword() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await api.put('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
      
      // Navigate back to profile page
      navigate('/affiliate/profile');
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="mb-4 mt-2">
        <Button 
          variant="outline" 
          size="lg" 
          className="flex items-center gap-2" 
          onClick={() => navigate('/affiliate/profile')}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Profile</span>
        </Button>
      </div>
      <Card className="overflow-hidden shadow-lg border-gray-200 max-w-md mx-auto">
        <CardHeader className="border-b bg-muted/40 px-6">
          <div>
            <CardTitle className="text-2xl">Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            {passwordError && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{passwordError}</div>}
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Current Password</label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium">Confirm New Password</label>
              <Input
                type="password"
                value={passwordForm.confirmNewPassword}
                onChange={e => setPasswordForm(f => ({ ...f, confirmNewPassword: e.target.value }))}
                required
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate('/affiliate/profile')}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 