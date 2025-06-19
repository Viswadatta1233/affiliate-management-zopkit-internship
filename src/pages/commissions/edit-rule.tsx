import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function EditCommissionRule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState(defaultForm);

  // Fetch all rules and filter by ID
  const { data: allRules, isLoading } = useQuery({
    queryKey: ['commission-rules'],
    queryFn: async () => (await apiCommissionRules.getAll()).data,
  });
  const rule = allRules?.find((r: any) => r.id === id);

  useEffect(() => {
    if (rule) {
      setForm({
        name: rule.name || '',
        description: rule.description || '',
        type: rule.type || '',
        condition: rule.condition || '',
        value: String(rule.value || ''),
        value_type: rule.value_type || '',
        status: rule.status || 'active',
        priority: rule.priority || 1,
        start_date: rule.start_date || '',
        end_date: rule.end_date || '',
      });
    }
  }, [rule]);

  const updateMutation = useMutation({
    mutationFn: (payload: any) =>
      apiCommissionRules.update(id!, {
        ...payload,
        value: parseFloat(payload.value),
        priority: parseInt(payload.priority as any, 10),
      }),
    onSuccess: () => {
      toast({ title: 'Rule updated' });
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      navigate('/commissions/rules');
    },
    onError: (error) => {
      console.error('Error updating rule:', error);
      toast({ title: 'Error updating rule', variant: 'destructive' });
    },
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <div className="container mx-auto p-8 max-w-xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Edit Commission Rule</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : !rule ? (
            <div>Rule not found.</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-1 font-medium" htmlFor="name">Rule Name</label>
                <Input id="name" name="name" value={form.name} onChange={handleFormChange} required />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="description">Description</label>
                <Input id="description" name="description" value={form.description} onChange={handleFormChange} />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="type">Type</label>
                <Input id="type" name="type" value={form.type} onChange={handleFormChange} required />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="condition">Condition</label>
                <Input id="condition" name="condition" value={form.condition} onChange={handleFormChange} required />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="value">Value</label>
                <Input id="value" name="value" type="number" value={form.value} onChange={handleFormChange} required />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="value_type">Value Type</label>
                <Input id="value_type" name="value_type" value={form.value_type} onChange={handleFormChange} required />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="status">Status</label>
                <select id="status" name="status" value={form.status} onChange={handleFormChange} className="w-full border rounded px-2 py-1">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="priority">Priority</label>
                <Input id="priority" name="priority" type="number" value={form.priority} onChange={handleFormChange} required />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="start_date">Start Date</label>
                <Input id="start_date" name="start_date" type="date" value={form.start_date} onChange={handleFormChange} />
              </div>
              <div>
                <label className="block mb-1 font-medium" htmlFor="end_date">End Date</label>
                <Input id="end_date" name="end_date" type="date" value={form.end_date} onChange={handleFormChange} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/commissions/rules')}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 