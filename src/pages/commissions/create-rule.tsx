import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
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
  priority: '1',
  start_date: '',
  end_date: '',
};

export default function CreateCommissionRule() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState(defaultForm);

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiCommissionRules.create(payload),
    onSuccess: () => {
      toast({ title: 'Rule created successfully' });
      queryClient.invalidateQueries({ queryKey: ['commission-rules'] });
      // Navigate back to rules page after successful creation
      setTimeout(() => {
        navigate('/commissions/rules');
      }, 1500);
    },
    onError: () => toast({ title: 'Error creating rule', variant: 'destructive' }),
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      value: form.value ? parseFloat(form.value) : null,
      priority: form.priority ? parseInt(form.priority, 10) : 1,
    });
  };

  return (
    <div className="container mx-auto py-8 px-2 sm:px-0 max-w-5xl">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
        onClick={() => navigate('/commissions/rules')}
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="font-medium">Back to Commission Rules</span>
      </Button>
      
      <Card className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <CardHeader className="p-8 border-b">
          <CardTitle className="text-3xl font-bold text-gray-800">Create Commission Rule</CardTitle>
          <CardDescription>
            Set up a new commission rule for special bonus conditions or multipliers.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g., First Sale Bonus"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Rule Type</Label>
                <select
                  id="type"
                  name="type"
                  value={form.type}
                  onChange={handleFormChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  required
                >
                  <option value="">Select Type</option>
                  <option value="bonus">Bonus</option>
                  <option value="multiplier">Multiplier</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Describe the purpose and conditions of this rule"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Input
                  id="condition"
                  name="condition"
                  value={form.condition}
                  onChange={handleFormChange}
                  placeholder="e.g., first_sale, monthly_target"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  step="0.01"
                  value={form.value}
                  onChange={handleFormChange}
                  placeholder="e.g., 10"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="value_type">Value Type</Label>
                <select
                  id="value_type"
                  name="value_type"
                  value={form.value_type}
                  onChange={handleFormChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">Select Value Type</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="percentage">Percentage</option>
                  <option value="multiplier">Multiplier</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  name="priority"
                  type="number"
                  min="1"
                  value={form.priority}
                  onChange={handleFormChange}
                  placeholder="e.g., 1"
                />
                <p className="text-sm text-muted-foreground">
                  Higher priority rules are applied first
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={handleFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/commissions/rules')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="px-6"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Rule'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 