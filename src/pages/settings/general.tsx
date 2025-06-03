import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function GeneralSettings() {
  const handleSaveChanges = () => {
    // Save settings changes
    console.log("Save changes clicked");
  };

  const handleCancel = () => {
    // Reset form to initial values
    console.log("Cancel clicked");
  };

  return (
    <div className="p-4 sm:p-6 w-full min-h-screen bg-background">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">General Settings</h1>
          <p className="text-muted-foreground">Manage your platform settings</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
          <CardDescription>Configure your platform settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">Configure your general settings here. This feature is coming soon.</p>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}