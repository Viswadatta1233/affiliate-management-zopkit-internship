import { create } from 'zustand';
import { api, apiAffiliates } from '@/lib/api';
import { Affiliate, TrackingLink, Commission } from '@/types';

interface ProductCommission {
  productId: string;
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
}

interface InviteAffiliateData {
  email: string;
  firstName?: string;
  lastName?: string;
  initialTier?: string;
  commissionRate?: number;
  productCommissions?: ProductCommission[];
}

interface AffiliateState {
  affiliates: Affiliate[];
  trackingLinks: TrackingLink[];
  commissions: Commission[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchAffiliates: () => Promise<void>;
  createAffiliate: (data: Partial<Affiliate>) => Promise<void>;
  updateAffiliate: (id: string, data: Partial<Affiliate>) => Promise<void>;
  deleteAffiliate: (id: string) => Promise<void>;
  inviteAffiliate: (data: InviteAffiliateData) => Promise<any>;
  
  // Tracking Links
  fetchTrackingLinks: () => Promise<void>;
  createTrackingLink: (data: Partial<TrackingLink>) => Promise<void>;
  updateTrackingLink: (id: string, data: Partial<TrackingLink>) => Promise<void>;
  deleteTrackingLink: (id: string) => Promise<void>;
  
  // Commissions
  fetchCommissions: () => Promise<void>;
  createCommission: (data: Partial<Commission>) => Promise<void>;
  updateCommission: (id: string, data: Partial<Commission>) => Promise<void>;
  deleteCommission: (id: string) => Promise<void>;
}

export const useAffiliateStore = create<AffiliateState>((set, get) => ({
  affiliates: [],
  trackingLinks: [],
  commissions: [],
  isLoading: false,
  error: null,

  // Affiliate actions
  fetchAffiliates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiAffiliates.getAll();
      set({ affiliates: response.data.affiliates, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch affiliates', isLoading: false });
      throw error;
    }
  },

  createAffiliate: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiAffiliates.create(data);
      set(state => ({
        affiliates: [...state.affiliates, response.data],
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to create affiliate', isLoading: false });
    }
  },

  inviteAffiliate: async (data: InviteAffiliateData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiAffiliates.invite(data);
      await get().fetchAffiliates();
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: 'Failed to invite affiliate', isLoading: false });
      throw error;
    }
  },

  updateAffiliate: async (id: string, data: Partial<Affiliate>) => {
    set({ isLoading: true, error: null });
    try {
      await apiAffiliates.update(id, data);
      await get().fetchAffiliates();
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to update affiliate', isLoading: false });
      throw error;
    }
  },

  deleteAffiliate: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiAffiliates.delete(id);
      set(state => ({
        affiliates: state.affiliates.filter(affiliate => affiliate.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete affiliate', isLoading: false });
      throw error;
    }
  },

  // Tracking Link actions
  fetchTrackingLinks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/tracking-links');
      set({ trackingLinks: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch tracking links', isLoading: false });
    }
  },

  createTrackingLink: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/tracking-links', data);
      set(state => ({
        trackingLinks: [...state.trackingLinks, response.data],
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to create tracking link', isLoading: false });
    }
  },

  updateTrackingLink: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/api/tracking-links/${id}`, data);
      set(state => ({
        trackingLinks: state.trackingLinks.map(link => 
          link.id === id ? response.data : link
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to update tracking link', isLoading: false });
    }
  },

  deleteTrackingLink: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/tracking-links/${id}`);
      set(state => ({
        trackingLinks: state.trackingLinks.filter(link => link.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete tracking link', isLoading: false });
    }
  },

  // Commission actions
  fetchCommissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/commissions');
      set({ commissions: response.data, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch commissions', isLoading: false });
    }
  },

  createCommission: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/api/commissions', data);
      set(state => ({
        commissions: [...state.commissions, response.data],
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to create commission', isLoading: false });
    }
  },

  updateCommission: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/api/commissions/${id}`, data);
      set(state => ({
        commissions: state.commissions.map(comm => 
          comm.id === id ? response.data : comm
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to update commission', isLoading: false });
    }
  },

  deleteCommission: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/api/commissions/${id}`);
      set(state => ({
        commissions: state.commissions.filter(comm => comm.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete commission', isLoading: false });
    }
  }
}));