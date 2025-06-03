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
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage your products</CardDescription>
          </div>
          <Button onClick={() => navigate('/products/create')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent>
          {/* Mobile Card/List View */}
          <div className="block md:hidden">
            {products.map(product => (
              <div key={product.id} className="mb-4 p-4 rounded-lg shadow bg-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{product.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{product.status}</span>
                </div>
                <div className="text-sm text-muted-foreground mb-2">SKU: {product.sku}</div>
                <div className="text-sm mb-2">Price: {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency || 'USD' }).format(product.price)}</div>
                <div className="text-sm mb-2">Commission: {product.commission_percent}%</div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => navigate(`/products/edit/${product.id}`)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{product.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteProductMutation.mutate(product.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
          {/* Table View for md+ screens */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <Table className="min-w-[700px] w-full text-sm sm:text-base">
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-left">Name</TableHead>
                    <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-left">SKU</TableHead>
                    <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-left">Price</TableHead>
                    <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-left">Commission</TableHead>
                    <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-left">Status</TableHead>
                    <TableHead className="py-3 px-2 sm:py-4 sm:px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium py-3 px-2 sm:py-4 sm:px-4">{product.name}</TableCell>
                      <TableCell className="py-3 px-2 sm:py-4 sm:px-4">{product.sku}</TableCell>
                      <TableCell className="py-3 px-2 sm:py-4 sm:px-4">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: product.currency || 'USD',
                        }).format(product.price)}
                      </TableCell>
                      <TableCell className="py-3 px-2 sm:py-4 sm:px-4">{product.commission_percent}%</TableCell>
                      <TableCell className="py-3 px-2 sm:py-4 sm:px-4">
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {product.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-3 px-2 sm:py-4 sm:px-4">
                        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 sm:h-10 sm:w-10"
                            onClick={() => navigate(`/products/edit/${product.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteProductMutation.mutate(product.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 