import { useState } from 'react';
import { Table } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
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
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Niche</th>
                <th>Country</th>
                <th>Status</th>
                <th>Followers</th>
                <th>Engagement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {influencers.map((influencer) => (
                <tr key={influencer.id}>
                  <td>{influencer.email}</td>
                  <td>{`${influencer.firstName} ${influencer.lastName}`}</td>
                  <td>{influencer.roleName}</td>
                  <td>{influencer.niche}</td>
                  <td>{influencer.country}</td>
                  <td>
                    <Badge variant={influencer.status === 'pending' ? 'warning' : 'success'}>
                      {influencer.status}
                    </Badge>
                  </td>
                  <td>{influencer.followers}</td>
                  <td>{influencer.engagement}%</td>
                  <td>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(influencer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedInfluencer(influencer);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
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