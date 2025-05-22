import { create } from 'zustand';
import { api } from '@/lib/api';
import { Product } from '@/types';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProducts: () => Promise<void>;
  getProductById: (id: string) => Promise<Product | null>;
  createProduct: (product: Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/products');
      set({ products: response.data.products, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch products', isLoading: false });
      console.error('Error fetching products:', error);
    }
  },

  getProductById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/api/products/${id}`);
      set({ isLoading: false });
      return response.data.product;
    } catch (error) {
      set({ error: 'Failed to fetch product', isLoading: false });
      console.error('Error fetching product:', error);
      return null;
    }
  },

  createProduct: async (product) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/products', product);
      set(state => ({
        products: [...state.products, response.data.product],
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to create product', isLoading: false });
      console.error('Error creating product:', error);
      throw error;
    }
  },

  updateProduct: async (id, product) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/api/products/${id}`, product);
      set(state => ({
        products: state.products.map(prod => 
          prod.id === id ? response.data.product : prod
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to update product', isLoading: false });
      console.error('Error updating product:', error);
      throw error;
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/products/${id}`);
      set(state => ({
        products: state.products.filter(product => product.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete product', isLoading: false });
      console.error('Error deleting product:', error);
      throw error;
    }
  }
})); 