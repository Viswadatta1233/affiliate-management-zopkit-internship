import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface PendingInvite {
  id: string;
  email: string;
  productIds: string[];
  product: {
    id: string;
    name: string;
    description: string | null;
    commissionPercent: string;
  } | null;
  createdAt: string;
  expiresAt: string;
  status: string;
}

const PendingAffiliates: React.FC = () => {
  const { toast } = useToast();
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingInvites();
  }, []);

  const fetchPendingInvites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/affiliates/pending-invites');
      console.log('Pending invites response:', response);
      setPendingInvites(response.data);
    } catch (error: any) {
      console.error('Error fetching pending invites:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch pending invites",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/api/affiliates/approve/${id}`, {});
      toast({
        title: "Success",
        description: "Affiliate invite approved successfully",
      });
      fetchPendingInvites(); // Refresh the list
    } catch (error: any) {
      console.error('Error approving invite:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve affiliate invite",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/api/affiliates/reject/${id}`, {});
      toast({
        title: "Success",
        description: "Affiliate invite rejected successfully",
      });
      fetchPendingInvites(); // Refresh the list
    } catch (error: any) {
      console.error('Error rejecting invite:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject affiliate invite",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve pending affiliate applications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
          <CardDescription>
            Review affiliate applications and verify their information before approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Product</TableHead>
                <TableHead className="hidden lg:table-cell">Invited</TableHead>
                <TableHead className="hidden md:table-cell">Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : pendingInvites.length > 0 ? (
                pendingInvites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {invite.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{invite.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {invite.product ? (
                        <div>
                          <div>{invite.product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Commission: {invite.product.commissionPercent}%
                          </div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {format(new Date(invite.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(new Date(invite.expiresAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-500 hover:text-green-600"
                          onClick={() => handleApprove(invite.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive/90"
                          onClick={() => handleReject(invite.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <UserPlus className="h-8 w-8 mb-2" />
                      <p>No pending applications</p>
                      <p className="text-sm">New applications will appear here</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingAffiliates;