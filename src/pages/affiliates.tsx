import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, MoreHorizontal, Users, PlusCircle, CheckCircle, XCircle, UserCog, FileText, Eye } from 'lucide-react';

// Sample affiliates data
const sampleAffiliates = [
  {
    id: '1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    referralCode: 'JANE2025',
    status: 'active',
    tierName: 'Gold',
    salesAmount: 24500,
    commissionsAmount: 3675,
    approvedAt: '2025-01-15',
    initials: 'JS'
  },
  {
    id: '2',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    referralCode: 'ALEX2025',
    status: 'active',
    tierName: 'Silver',
    salesAmount: 18750,
    commissionsAmount: 2812.5,
    approvedAt: '2025-02-10',
    initials: 'AJ'
  },
  {
    id: '3',
    name: 'Lisa Brown',
    email: 'lisa@example.com',
    referralCode: 'LISA2025',
    status: 'active',
    tierName: 'Bronze',
    salesAmount: 15200,
    commissionsAmount: 2280,
    approvedAt: '2025-02-28',
    initials: 'LB'
  },
  {
    id: '4',
    name: 'David Miller',
    email: 'david@example.com',
    referralCode: 'DAVID2025',
    status: 'active',
    tierName: 'Bronze',
    salesAmount: 9800,
    commissionsAmount: 1470,
    approvedAt: '2025-03-05',
    initials: 'DM'
  },
  {
    id: '5',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    referralCode: 'SARAH2025',
    status: 'pending',
    tierName: 'Standard',
    salesAmount: 0,
    commissionsAmount: 0,
    approvedAt: null,
    initials: 'SW'
  },
  {
    id: '6',
    name: 'Michael Davis',
    email: 'michael@example.com',
    referralCode: 'MICHAEL2025',
    status: 'suspended',
    tierName: 'Standard',
    salesAmount: 3500,
    commissionsAmount: 525,
    approvedAt: '2025-01-20',
    initials: 'MD'
  }
];

const Affiliates: React.FC = () => {
  const { user, tenant } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Filter affiliates based on search query and status filter
  const filteredAffiliates = sampleAffiliates.filter(affiliate => {
    const matchesSearch = 
      affiliate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.referralCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      affiliate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affiliates</h1>
          <p className="text-muted-foreground">
            Manage your affiliate partners and their performance.
          </p>
        </div>
        
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Invite Affiliate
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Affiliates</CardTitle>
              <CardDescription>
                A list of your current and pending affiliates.
              </CardDescription>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search affiliates..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="shrink-0">
                    {statusFilter === 'all' ? 'All Status' : 
                     statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('suspended')}>
                    Suspended
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Affiliate</TableHead>
                <TableHead className="hidden md:table-cell">Referral Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Tier</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead className="hidden lg:table-cell">Commissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAffiliates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Users className="h-8 w-8 mb-2" />
                      <p>No affiliates found</p>
                      <p className="text-sm">Try adjusting your search or filter</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAffiliates.map((affiliate) => (
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
                    <TableCell className="hidden md:table-cell font-mono text-sm">
                      {affiliate.referralCode}
                    </TableCell>
                    <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">{affiliate.tierName}</TableCell>
                    <TableCell>{formatCurrency(affiliate.salesAmount)}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatCurrency(affiliate.commissionsAmount)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to={`/affiliates/${affiliate.id}`} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" /> View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" /> View Payouts
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {affiliate.status === 'pending' ? (
                            <>
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                              </DropdownMenuItem>
                            </>
                          ) : affiliate.status === 'active' ? (
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <XCircle className="mr-2 h-4 w-4" /> Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" /> Reactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Affiliates;