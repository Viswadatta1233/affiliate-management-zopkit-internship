import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';
import { apiProductCommissions } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ProductCommissions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['product-commissions'],
    queryFn: async () => (await apiProductCommissions.getAll()).data,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, commissionPercent }: { id: string; commissionPercent: number }) =>
      apiProductCommissions.update(id, { commissionPercent }),
    onSuccess: () => {
      toast({ title: 'Commission updated' });
      setEditId(null);
      setEditValue('');
      queryClient.invalidateQueries({ queryKey: ['product-commissions'] });
    },
    onError: () => toast({ title: 'Error updating commission', variant: 'destructive' }),
  });

  const handleEdit = (id: string, value: string) => {
    setEditId(id);
    setEditValue(value);
  };

  const handleSave = (id: string) => {
    updateMutation.mutate({ id, commissionPercent: parseFloat(editValue) });
  };

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Commissions</h1>
          <p className="text-muted-foreground">Manage product-specific commission rates</p>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 w-full overflow-x-auto">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Product Commissions</h2>
          <p className="text-muted-foreground">Products with commission rates</p>
        </div>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <table className="min-w-full table-auto border-separate border-spacing-y-2">
            <thead>
              <tr>
                <th className="text-left px-4 py-2 font-semibold">Product Name</th>
                <th className="text-left px-4 py-2 font-semibold">SKU</th>
                <th className="text-left px-4 py-2 font-semibold">Commission (%)</th>
                <th className="text-right px-4 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((product: any) => (
                <tr key={product.id} className="bg-gray-50 hover:bg-gray-100 rounded-lg">
                  <td className="px-4 py-3 rounded-l-lg">{product.name}</td>
                  <td className="px-4 py-3">{product.sku}</td>
                  <td className="px-4 py-3">
                    {editId === product.id ? (
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="w-24"
                      />
                    ) : (
                      product.commissionPercent
                    )}
                  </td>
                  <td className="px-4 py-3 text-right rounded-r-lg">
                    {editId === product.id ? (
                      <>
                        <Button size="sm" onClick={() => handleSave(product.id)} disabled={updateMutation.isPending}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditId(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(product.id, product.commissionPercent)}
                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200"
                        aria-label="Edit"
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}