import React from 'react';
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

// Sample pending affiliates data
const pendingAffiliates = [
  {
    id: '1',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    companyName: 'Wilson Marketing',
    websiteUrl: 'https://wilson-marketing.com',
    appliedAt: new Date(2025, 2, 15),
    promotionalMethods: ['Social Media', 'Blog', 'Email'],
    initials: 'SW'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael@example.com',
    companyName: 'Chen Digital',
    websiteUrl: 'https://chen-digital.com',
    appliedAt: new Date(2025, 2, 14),
    promotionalMethods: ['Social Media', 'Paid Ads'],
    initials: 'MC'
  },
  {
    id: '3',
    name: 'Emma Davis',
    email: 'emma@example.com',
    companyName: 'Davis & Associates',
    websiteUrl: 'https://davis-associates.com',
    appliedAt: new Date(2025, 2, 13),
    promotionalMethods: ['Blog', 'Email', 'Content Marketing'],
    initials: 'ED'
  }
];

const PendingAffiliates: React.FC = () => {
  const { user, tenant } = useAuthStore();

  const handleApprove = (id: string) => {
    // Handle affiliate approval
    console.log('Approve affiliate:', id);
  };

  const handleReject = (id: string) => {
    // Handle affiliate rejection
    console.log('Reject affiliate:', id);
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
                <TableHead>Affiliate</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="hidden lg:table-cell">Website</TableHead>
                <TableHead className="hidden md:table-cell">Applied</TableHead>
                <TableHead>Methods</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingAffiliates.map((affiliate) => (
                <TableRow key={affiliate.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback>{affiliate.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{affiliate.name}</div>
                        <div className="text-xs text-muted-foreground">{affiliate.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {affiliate.companyName}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <a 
                      href={affiliate.websiteUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {new URL(affiliate.websiteUrl).hostname}
                    </a>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(affiliate.appliedAt, 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {affiliate.promotionalMethods.map((method, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-xs"
                        >
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-500 hover:text-green-600"
                        onClick={() => handleApprove(affiliate.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive/90"
                        onClick={() => handleReject(affiliate.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pendingAffiliates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
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