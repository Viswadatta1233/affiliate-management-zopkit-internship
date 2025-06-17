import React, { useEffect, useState } from 'react';
import { useProductStore } from '@/store/product-store';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Product } from '@/types';
import { useNavigate } from 'react-router-dom';

type ProductFormData = Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>;

const ProductsPage: React.FC = () => {
  const { products, isLoading, error, fetchProducts, createProduct, updateProduct, deleteProduct } = useProductStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    imageUrl: '',
    price: 0,
    currency: 'USD',
    category: '',
    sku: '',
    commission_percent: 0,
    status: 'active',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['price', 'commission_percent'].includes(name) 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (data: ProductFormData): string | null => {
    if (!data.name.trim()) return 'Name is required';
    if (!data.sku.trim()) return 'SKU is required';
    if (data.price <= 0) return 'Price must be greater than 0';
    if (data.commission_percent < 0 || data.commission_percent > 100) return 'Commission percentage must be between 0 and 100';
    return null;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      price: 0,
      currency: 'USD',
      category: '',
      sku: '',
      commission_percent: 0,
      status: 'active',
    });
    setCurrentProduct(null);
  };

  const handleCreateProduct = async () => {
    try {
      const validationError = validateForm(formData);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const productData = {
        ...formData,
        price: Number(formData.price),
        commission_percent: Number(formData.commission_percent),
      };

      await createProduct(productData);
      toast.success('Product created successfully');
      setIsCreateDialogOpen(false);
      resetForm();
      fetchProducts(); // Refresh the products list
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 sm:p-6 w-full min-h-screen bg-gray-50">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-4xl font-bold">Products</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" /> New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl font-semibold">Create New Product</DialogTitle>
              <DialogDescription className="text-sm sm:text-base">Add a new product to your catalog.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Name</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">SKU</Label>
                  <Input
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Price</Label>
                  <Input
                    name="price"
                    type="number"
                    value={formData.price || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => handleSelectChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Input
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Commission %</Label>
                  <Input
                    name="commission_percent"
                    type="number"
                    value={formData.commission_percent || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Image URL</Label>
                <Input
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'inactive') => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="gap-3 pt-4">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Create Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[600px]">
          <div className="animate-spin h-16 w-16 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg bg-white shadow-sm">
          <Table className="min-w-[700px] w-full text-sm sm:text-base">
            <TableHeader>
              <TableRow>
                  <TableHead className="py-3 px-2 sm:py-6 sm:px-4 text-left">Name</TableHead>
                  <TableHead className="py-3 px-2 sm:py-6 sm:px-4 text-left">Price</TableHead>
                  <TableHead className="py-3 px-2 sm:py-6 sm:px-4 text-left">Category</TableHead>
                  <TableHead className="py-3 px-2 sm:py-6 sm:px-4 text-left">Status</TableHead>
                  <TableHead className="py-3 px-2 sm:py-6 sm:px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 sm:py-12 text-gray-500 text-base sm:text-xl">
                    No products found. Create your first product!
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                    <TableRow key={product.id} className="text-sm sm:text-base">
                      <TableCell className="font-medium py-3 px-2 sm:py-6 sm:px-4">{product.name}</TableCell>
                      <TableCell className="py-3 px-2 sm:py-6 sm:px-4">
                      {product.price.toLocaleString(undefined, {
                        style: 'currency',
                        currency: product.currency,
                      })}
                    </TableCell>
                      <TableCell className="py-3 px-2 sm:py-6 sm:px-4">{product.category || '-'}</TableCell>
                      <TableCell className="py-3 px-2 sm:py-6 sm:px-4">
                        <span className={`px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${
                        product.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                        }`}>
                          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-3 px-2 sm:py-6 sm:px-4">
                        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 sm:h-12 sm:w-12" 
                        onClick={() => navigate(`/products/${product.id}/edit`)}
                      >
                            <Pencil size={18} className="sm:w-6 sm:h-6" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 sm:h-12 sm:w-12" 
                        onClick={() => {
                          toast.success('Deleting product...');
                          deleteProduct(product.id)
                            .then(() => toast.success('Product deleted successfully'))
                            .catch(() => toast.error('Failed to delete product'));
                        }}
                      >
                            <Trash2 size={18} className="sm:w-6 sm:h-6" />
                      </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ProductsPage; 