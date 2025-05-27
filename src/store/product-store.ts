import { create } from 'zustand';
import { api } from '@/lib/api';
import { Product } from '@/types';

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProducts: () => Promise<void>;
  createProduct: (product: Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useProductStore = create<ProductState>()((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/products');
      set({ products: response.data, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        isLoading: false 
      });
    }
  },

  createProduct: async (product) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/products', product);
      const newProduct = response.data;
      set(state => ({
        products: [...state.products, newProduct],
        isLoading: false
      }));
      return newProduct;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create product',
        isLoading: false 
      });
      throw error;
    }
  },

  updateProduct: async (id, product) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/api/products/${id}`, product);
      const updatedProduct = response.data;
      set(state => ({
        products: state.products.map(p => p.id === id ? updatedProduct : p),
        isLoading: false
      }));
      return updatedProduct;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update product',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/products/${id}`);
      set(state => ({
        products: state.products.filter(p => p.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete product',
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  }
})); 