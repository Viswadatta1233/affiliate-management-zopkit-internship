import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Search, MoreHorizontal, FileText, PlusCircle } from 'lucide-react';

// Sample commission rules data
const sampleCommissionRules = [
  {
    id: '1',
    name: 'First Sale Bonus',
    description: 'Extra commission for affiliate\'s first successful sale',
    type: 'bonus',
    condition: 'first_sale',
    value: 50,
    valueType: 'fixed',
    status: 'active',
    priority: 1,
    startDate: '2025-01-01',
    endDate: null
  },
  {
    id: '2',
    name: 'Volume Multiplier',
    description: 'Increased commission rate for high-volume sales',
    type: 'multiplier',
    condition: 'monthly_sales > 10000',
    value: 1.5,
    valueType: 'multiplier',
    status: 'active',
    priority: 2,
    startDate: '2025-01-01',
    endDate: '2025-12-31'
  },
  {
    id: '3',
    name: 'Seasonal Promotion',
    description: 'Holiday season commission boost',
    type: 'bonus',
    condition: 'date_range',
    value: 25,
    valueType: 'percentage',
    status: 'inactive',
    priority: 3,
    startDate: '2025-11-01',
    endDate: '2025-12-31'
  }
];

const CommissionRules: React.FC = () => {
  const { user, tenant } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter rules based on search query and status filter
  const filteredRules = sampleCommissionRules.filter(rule => {
    const matchesSearch = 
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      rule.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Format rule value
  const formatRuleValue = (value: number, type: string) => {
    switch (type) {
      case 'fixed':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'multiplier':
        return `${value}x`;
      default:
        return value;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Inactive</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'bonus':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Bonus</Badge>;
      case 'multiplier':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Multiplier</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Rules</h1>
          <p className="text-muted-foreground">
            Manage special commission rules and bonus conditions.
          </p>
        </div>
        
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Rule
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Commission Rules</CardTitle>
              <CardDescription>
                Configure special commission rules and bonus conditions.
              </CardDescription>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search rules..."
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
                  <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                    Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter('expired')}>
                    Expired
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
                <TableHead>Rule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="hidden md:table-cell">Condition</TableHead>
                <TableHead className="hidden lg:table-cell">Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText className="h-8 w-8 mb-2" />
                      <p>No commission rules found</p>
                      <p className="text-sm">Try adjusting your search or filter</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-xs text-muted-foreground">{rule.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(rule.type)}</TableCell>
                    <TableCell>
                      {formatRuleValue(rule.value, rule.valueType)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {rule.condition}
                      </code>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {rule.priority}
                    </TableCell>
                    <TableCell>{getStatusBadge(rule.status)}</TableCell>
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
                          <DropdownMenuItem>Edit Rule</DropdownMenuItem>
                          <DropdownMenuItem>View History</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {rule.status === 'active' ? (
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem>
                              Activate
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

export default CommissionRules;