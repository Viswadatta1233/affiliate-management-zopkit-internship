import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Mail, User, Globe, Briefcase, Flag, BarChart, Users } from 'lucide-react';
import { InfluencerDialog } from './InfluencerDialog';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Influencer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  niche: string;
  country: string;
  status: string;
  followers: string;
  engagement: string;
}

interface InfluencerListProps {
  influencers: Influencer[];
  onRefresh: () => void;
}

export function InfluencerList({ influencers, onRefresh }: InfluencerListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const { toast } = useToast();

  const handleEdit = (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/influencers?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete influencer');
      }

      toast({
        title: 'Success',
        description: 'Influencer deleted successfully',
      });
      onRefresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete influencer',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const url = selectedInfluencer
        ? `/api/influencers?id=${selectedInfluencer.id}`
        : '/api/influencers';
      const method = selectedInfluencer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save influencer');
      }

      toast({
        title: 'Success',
        description: selectedInfluencer
          ? 'Influencer updated successfully'
          : 'Influencer created successfully',
      });
      onRefresh();
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save influencer',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Influencers</h2>
          <Button onClick={() => {
            setSelectedInfluencer(null);
            setDialogOpen(true);
          }}>
            Add New Influencer
          </Button>
        </div>
        
        {/* Grid Layout at Section Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {influencers.map((influencer) => (
            <Card key={influencer.id} className="overflow-hidden border rounded-lg">
              <div className="p-4 bg-muted/20">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{`${influencer.firstName} ${influencer.lastName}`}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 mr-1" />
                      <span>{influencer.email}</span>
                    </div>
                  </div>
                  <Badge variant={influencer.status === 'pending' ? 'warning' : 'success'}>
                    {influencer.status}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Section-level grid for influencer details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Role</div>
                    <div className="flex items-center">
                      <Briefcase className="h-3.5 w-3.5 mr-1 text-primary" />
                      <span>{influencer.roleName}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Niche</div>
                    <div className="flex items-center">
                      <User className="h-3.5 w-3.5 mr-1 text-primary" />
                      <span>{influencer.niche}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Country</div>
                    <div className="flex items-center">
                      <Flag className="h-3.5 w-3.5 mr-1 text-primary" />
                      <span>{influencer.country}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Followers</div>
                    <div className="flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1 text-primary" />
                      <span>{influencer.followers}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Engagement Rate</div>
                  <div className="flex items-center">
                    <BarChart className="h-3.5 w-3.5 mr-1 text-primary" />
                    <span>{influencer.engagement}%</span>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(influencer)}
                    className="flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedInfluencer(influencer);
                      setDeleteDialogOpen(true);
                    }}
                    className="flex items-center text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <InfluencerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={selectedInfluencer}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              influencer and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedInfluencer && handleDelete(selectedInfluencer.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 