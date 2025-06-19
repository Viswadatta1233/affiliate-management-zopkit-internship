import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { apiCommissionRules } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const defaultForm = {
  name: '',
  description: '',
  type: '',
  condition: '',
  value: '',
  value_type: '',
    status: 'active',
    priority: 1,
  start_date: '',
  end_date: '',
};

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

const formatRuleValue = (value: any, type: string) => {
  if (value === null || value === undefined) return '';
  switch (type) {
    case 'fixed':
      return `$${parseFloat(value).toLocaleString()}`;
    case 'percentage':
      return `${value}%`;
    case 'multiplier':
      return `${value}x`;
    default:
      return value;
  }
};

export default function CommissionRules() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editRule, setEditRule] = useState<any | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['commission-rules'],
    queryFn: async () => (await apiCommissionRules.getAll()).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiCommissionRules.create(payload),
    onSuccess: () => {
      toast({ title: 'Rule created' });
      setIsDialogOpen(false);
      setForm(defaultForm);
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    },
    onError: () => toast({ title: 'Error creating rule', variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: any) => apiCommissionRules.update(id, payload),
    onSuccess: () => {
      toast({ title: 'Rule updated' });
      setEditRule(null);
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    },
    onError: () => toast({ title: 'Error updating rule', variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiCommissionRules.delete(id),
    onSuccess: () => {
      toast({ title: 'Rule deleted' });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
    },
    onError: () => toast({ title: 'Error deleting rule', variant: 'destructive' }),
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      value: parseFloat(form.value),
      priority: parseInt(form.priority as any, 10),
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRule) return;
    updateMutation.mutate({
      id: editRule.id,
      ...editRule,
      value: parseFloat(editRule.value),
      priority: parseInt(editRule.priority as any, 10),
    });
  };

  // Filter rules based on search query and status filter
  const filteredRules = (data || []).filter((rule: any) => {
    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rule.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || rule.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Rules</h1>
          <p className="text-muted-foreground">Manage special commission rules and bonus conditions.</p>
        </div>
        <Button className="shadow-md" onClick={() => navigate('/commissions/rules/create')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Rule
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 w-full overflow-x-auto">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
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
              <select
                className="border rounded px-2 py-1 text-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>
        </div>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            {/* Mobile Card/List View */}
            <div className="block md:hidden">
              {filteredRules.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No commission rules found</div>
              ) : (
                filteredRules.map((rule: any) => (
                  <div key={rule.id} className="mb-4 p-4 rounded-lg shadow bg-gray-50">
                    <div className="font-bold mb-1">{rule.name}</div>
                    <div className="text-xs text-muted-foreground mb-1">{rule.description}</div>
                    <div className="text-sm mb-1">Type: {getTypeBadge(rule.type)}</div>
                    <div className="text-sm mb-1">Value: {formatRuleValue(rule.value, rule.value_type)}</div>
                    <div className="text-sm mb-1">Status: {getStatusBadge(rule.status)}</div>
                    <div className="text-sm mb-1">Condition: <code className="bg-muted px-1 py-0.5 rounded">{rule.condition}</code></div>
                    <div className="text-sm mb-1">Priority: {rule.priority}</div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate(`/commissions/rules/${rule.id}/edit`)}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                        aria-label="Edit"
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(rule.id)}
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Table View for md+ screens */}
            <div className="hidden md:block">
              <table className="min-w-full table-auto border-separate border-spacing-y-2">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Rule</th>
                    <th className="text-left px-4 py-2 font-semibold">Type</th>
                    <th className="text-left px-4 py-2 font-semibold">Value</th>
                    <th className="text-left px-4 py-2 font-semibold hidden md:table-cell">Condition</th>
                    <th className="text-left px-4 py-2 font-semibold hidden lg:table-cell">Priority</th>
                    <th className="text-left px-4 py-2 font-semibold">Status</th>
                    <th className="text-right px-4 py-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-muted-foreground">No commission rules found</td>
                    </tr>
                  ) : (
                    filteredRules.map((rule: any) => (
                      <tr key={rule.id} className="bg-gray-50 hover:bg-gray-100 rounded-lg">
                        <td className="px-4 py-3 rounded-l-lg">
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-xs text-muted-foreground">{rule.description}</div>
                        </td>
                        <td className="px-4 py-3">{getTypeBadge(rule.type)}</td>
                        <td className="px-4 py-3">{formatRuleValue(rule.value, rule.value_type)}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">{rule.condition}</code>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">{rule.priority}</td>
                        <td className="px-4 py-3">{getStatusBadge(rule.status)}</td>
                        <td className="px-4 py-3 text-right rounded-r-lg">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => navigate(`/commissions/rules/${rule.id}/edit`)}
                              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                              aria-label="Edit"
                            >
                              <Pencil className="h-5 w-5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(rule.id)}
                              className="text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
            <DialogDescription>Are you sure you want to delete this rule?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}