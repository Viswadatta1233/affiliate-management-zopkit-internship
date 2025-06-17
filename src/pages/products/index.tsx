import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { apiProducts } from '@/lib/api';
import { Product } from '@/types';

export default function ProductsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await apiProducts.getAll();
      return response.data;
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => apiProducts.delete(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete product',
        variant: 'destructive',
      });
    },
  });

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-red-600 mb-4">Failed to load products</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Products</CardTitle>
              <CardDescription>Manage your products</CardDescription>
            </div>
            <Button onClick={() => navigate('/products/create')}>
              Create your first product
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground mb-4">No products found</p>
            <Button onClick={() => navigate('/products/create')}>
              Create your first product
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="border-none shadow-md rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-white border-b p-6">
          <div>
            <CardTitle className="text-2xl font-bold">Products</CardTitle>
            <CardDescription className="text-gray-500 mt-1">Manage your product catalog</CardDescription>
          </div>
          <Button 
            onClick={() => navigate('/products/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Product
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {/* Table View */}
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="py-4 px-6 text-sm font-medium text-gray-600">Name</TableHead>
                  <TableHead className="py-4 px-6 text-sm font-medium text-gray-600">Price</TableHead>
                  <TableHead className="py-4 px-6 text-sm font-medium text-gray-600">Category</TableHead>
                  <TableHead className="py-4 px-6 text-sm font-medium text-gray-600">Status</TableHead>
                  <TableHead className="py-4 px-6 text-sm font-medium text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: Product) => (
                  <TableRow 
                    key={product.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="py-4 px-6 font-medium">{product.name}</TableCell>
                    <TableCell className="py-4 px-6">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: product.currency || 'USD',
                      }).format(product.price)}
                    </TableCell>
                    <TableCell className="py-4 px-6">{product.category || 'Others'}</TableCell>
                    <TableCell className="py-4 px-6">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {product.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                          onClick={() => navigate(`/products/edit/${product.id}`)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            toast({
                              title: "Deleting product...",
                              description: `Removing "${product.name}"`,
                            });
                            deleteProductMutation.mutate(product.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 