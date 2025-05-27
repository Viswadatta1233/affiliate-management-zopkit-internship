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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Product } from '@/types';

type ProductFormData = Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>;

const ProductsPage: React.FC = () => {
  const { products, isLoading, error, fetchProducts, createProduct, updateProduct, deleteProduct } = useProductStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  const openEditDialog = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      price: Number(product.price),
      currency: product.currency,
      category: product.category || '',
      sku: product.sku,
      commission_percent: Number(product.commission_percent),
      status: product.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!currentProduct) return;
    
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

      await updateProduct(currentProduct.id, productData);
      toast.success('Product updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      fetchProducts(); // Refresh the products list
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const openDeleteDialog = (product: Product) => {
    setCurrentProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!currentProduct) return;
    
    try {
      await deleteProduct(currentProduct.id);
      toast.success('Product deleted successfully');
      setIsDeleteDialogOpen(false);
      setCurrentProduct(null);
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6 w-full min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Products</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 h-12 px-6 text-lg">
              <Plus size={24} />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[1200px] w-[95vw] min-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="text-4xl font-bold mb-6">Create New Product</DialogTitle>
            </DialogHeader>
            <div className="grid gap-8 py-8">
              <div className="grid grid-cols-4 items-center gap-8">
                <Label htmlFor="name" className="text-right text-xl font-medium">Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className="col-span-3 h-16 text-xl px-6" 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-8">
                <Label htmlFor="description" className="text-right text-xl font-medium pt-4">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  className="col-span-3 min-h-[200px] text-xl p-6" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-8">
                <Label htmlFor="imageUrl" className="text-right text-xl font-medium">Image URL</Label>
                <Input 
                  id="imageUrl" 
                  name="imageUrl" 
                  value={formData.imageUrl} 
                  onChange={handleInputChange} 
                  className="col-span-3 h-16 text-xl px-6" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-8">
                <Label htmlFor="price" className="text-right text-xl font-medium">Price</Label>
                <Input 
                  id="price" 
                  name="price" 
                  type="number" 
                  value={formData.price || ''} 
                  onChange={handleInputChange} 
                  className="col-span-3 h-16 text-xl px-6" 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-8">
                <Label htmlFor="currency" className="text-right text-xl font-medium">Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => handleSelectChange('currency', value)}
                >
                  <SelectTrigger className="col-span-3 h-16 text-xl">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD" className="text-xl py-4">USD</SelectItem>
                    <SelectItem value="EUR" className="text-xl py-4">EUR</SelectItem>
                    <SelectItem value="GBP" className="text-xl py-4">GBP</SelectItem>
                    <SelectItem value="INR" className="text-xl py-4">INR</SelectItem>
                    <SelectItem value="JPY" className="text-xl py-4">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-8">
                <Label htmlFor="category" className="text-right text-xl font-medium">Category</Label>
                <Input 
                  id="category" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleInputChange} 
                  className="col-span-3 h-16 text-xl px-6" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-8">
                <Label htmlFor="sku" className="text-right text-xl font-medium">SKU</Label>
                <Input 
                  id="sku" 
                  name="sku" 
                  value={formData.sku} 
                  onChange={handleInputChange} 
                  className="col-span-3 h-16 text-xl px-6" 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-8">
                <Label htmlFor="commission_percent" className="text-right text-xl font-medium">Commission %</Label>
                <Input 
                  id="commission_percent" 
                  name="commission_percent" 
                  type="number" 
                  value={formData.commission_percent || ''} 
                  onChange={handleInputChange} 
                  className="col-span-3 h-16 text-xl px-6" 
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-8">
                <Label htmlFor="status" className="text-right text-xl font-medium">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'active' | 'inactive') => handleSelectChange('status', value)}
                >
                  <SelectTrigger className="col-span-3 h-16 text-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-xl py-4">Active</SelectItem>
                    <SelectItem value="inactive" className="text-xl py-4">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-6 pt-6">
              <DialogClose asChild>
                <Button variant="outline" className="h-16 px-10 text-xl">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateProduct} className="h-16 px-10 text-xl">Create Product</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[600px]">
          <div className="animate-spin h-16 w-16 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-6">
        <Table>
          <TableHeader>
            <TableRow>
                <TableHead className="text-lg py-6">Name</TableHead>
                <TableHead className="text-lg py-6">Price</TableHead>
                <TableHead className="text-lg py-6">Category</TableHead>
                <TableHead className="text-lg py-6">Status</TableHead>
                <TableHead className="text-lg py-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-gray-500 text-xl">
                  No products found. Create your first product!
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                  <TableRow key={product.id} className="text-lg">
                    <TableCell className="font-medium py-6">{product.name}</TableCell>
                    <TableCell className="py-6">
                    {product.price.toLocaleString(undefined, {
                      style: 'currency',
                      currency: product.currency,
                    })}
                  </TableCell>
                    <TableCell className="py-6">{product.category || '-'}</TableCell>
                    <TableCell className="py-6">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      product.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </span>
                  </TableCell>
                    <TableCell className="text-right py-6">
                      <div className="flex justify-end gap-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                          className="h-12 w-12" 
                      onClick={() => openEditDialog(product)}
                    >
                          <Pencil size={24} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                          className="h-12 w-12" 
                      onClick={() => openDeleteDialog(product)}
                    >
                          <Trash2 size={24} />
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[1200px] w-[95vw] min-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-4xl font-bold mb-6">Edit Product</DialogTitle>
          </DialogHeader>
          <div className="grid gap-8 py-8">
            <div className="grid grid-cols-4 items-center gap-8">
              <Label htmlFor="edit-name" className="text-right text-xl font-medium">Name</Label>
              <Input 
                id="edit-name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                className="col-span-3 h-16 text-xl px-6" 
                required
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-8">
              <Label htmlFor="edit-description" className="text-right text-xl font-medium pt-4">Description</Label>
              <Textarea 
                id="edit-description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                className="col-span-3 min-h-[200px] text-xl p-6" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-8">
              <Label htmlFor="edit-imageUrl" className="text-right text-xl font-medium">Image URL</Label>
              <Input 
                id="edit-imageUrl" 
                name="imageUrl" 
                value={formData.imageUrl} 
                onChange={handleInputChange} 
                className="col-span-3 h-16 text-xl px-6" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-8">
              <Label htmlFor="edit-price" className="text-right text-xl font-medium">Price</Label>
              <Input 
                id="edit-price" 
                name="price" 
                type="number" 
                value={formData.price || ''} 
                onChange={handleInputChange} 
                className="col-span-3 h-16 text-xl px-6" 
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-8">
              <Label htmlFor="edit-currency" className="text-right text-xl font-medium">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => handleSelectChange('currency', value)}
              >
                <SelectTrigger className="col-span-3 h-16 text-xl">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD" className="text-xl py-4">USD</SelectItem>
                  <SelectItem value="EUR" className="text-xl py-4">EUR</SelectItem>
                  <SelectItem value="GBP" className="text-xl py-4">GBP</SelectItem>
                  <SelectItem value="INR" className="text-xl py-4">INR</SelectItem>
                  <SelectItem value="JPY" className="text-xl py-4">JPY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-8">
              <Label htmlFor="edit-category" className="text-right text-xl font-medium">Category</Label>
              <Input 
                id="edit-category" 
                name="category" 
                value={formData.category} 
                onChange={handleInputChange} 
                className="col-span-3 h-16 text-xl px-6" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-8">
              <Label htmlFor="edit-sku" className="text-right text-xl font-medium">SKU</Label>
              <Input 
                id="edit-sku" 
                name="sku" 
                value={formData.sku} 
                onChange={handleInputChange} 
                className="col-span-3 h-16 text-xl px-6" 
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-8">
              <Label htmlFor="edit-commission_percent" className="text-right text-xl font-medium">Commission %</Label>
              <Input 
                id="edit-commission_percent" 
                name="commission_percent" 
                type="number" 
                value={formData.commission_percent || ''} 
                onChange={handleInputChange} 
                className="col-span-3 h-16 text-xl px-6" 
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-8">
              <Label htmlFor="edit-status" className="text-right text-xl font-medium">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'inactive') => handleSelectChange('status', value)}
              >
                <SelectTrigger className="col-span-3 h-16 text-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-xl py-4">Active</SelectItem>
                  <SelectItem value="inactive" className="text-xl py-4">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-6 pt-6">
            <DialogClose asChild>
              <Button variant="outline" className="h-16 px-10 text-xl">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateProduct} className="h-16 px-10 text-xl">Update Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-[600px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold mb-4">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-xl">Are you sure you want to delete the product "{currentProduct?.name}"?</p>
            <p className="text-lg text-muted-foreground mt-4">This action cannot be undone.</p>
          </div>
          <DialogFooter className="gap-6 pt-6">
            <DialogClose asChild>
              <Button variant="outline" className="h-16 px-10 text-xl">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteProduct} className="h-16 px-10 text-xl">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPage; 