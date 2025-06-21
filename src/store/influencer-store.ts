import { create } from 'zustand';
import api from '@/lib/axios';
import { InfluencerInstaAnalytics, InfluencerFbAnalytics, InfluencerTwitterAnalytics } from '@/server/db/schema';

interface InfluencerState {
  instagramAnalytics: InfluencerInstaAnalytics | null;
  facebookAnalytics: InfluencerFbAnalytics | null;
  twitterAnalytics: InfluencerTwitterAnalytics | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  isFbConnected: boolean;
  isTwitterConnected: boolean;
  connectInstagram: (username: string) => Promise<void>;
  fetchInstagramAnalytics: () => Promise<void>;
  connectFacebook: (username: string) => Promise<void>;
  fetchFacebookAnalytics: () => Promise<void>;
  connectTwitter: (username: string) => Promise<void>;
  fetchTwitterAnalytics: () => Promise<void>;
  clearError: () => void;
}

export const useInfluencerStore = create<InfluencerState>((set) => ({
  instagramAnalytics: null,
  facebookAnalytics: null,
  twitterAnalytics: null,
  isLoading: false,
  error: null,
  isConnected: false,
  isFbConnected: false,
  isTwitterConnected: false,

  connectInstagram: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/influencers/connect-instagram', { username });
      const { analytics } = response.data;
      set({
        instagramAnalytics: analytics,
        isConnected: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  fetchInstagramAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/influencers/instagram-analytics');
      if (response.data.analytics) {
        set({
          instagramAnalytics: response.data.analytics,
          isConnected: true,
          isLoading: false
        });
      } else {
        set({ isConnected: false, isLoading: false });
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        set({ error: 'Failed to fetch Instagram analytics.', isLoading: false });
      } else {
        set({ isConnected: false, isLoading: false });
      }
    }
  },

  connectFacebook: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/influencers/connect-facebook', { username });
      const { analytics } = response.data;
      set({
        facebookAnalytics: analytics,
        isFbConnected: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  fetchFacebookAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/influencers/facebook-analytics');
      if (response.data.analytics) {
        set({
          facebookAnalytics: response.data.analytics,
          isFbConnected: true,
          isLoading: false
        });
      } else {
        set({ isFbConnected: false, isLoading: false });
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        set({ error: 'Failed to fetch Facebook analytics.', isLoading: false });
      } else {
        set({ isFbConnected: false, isLoading: false });
      }
    }
  },

  connectTwitter: async (username: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/influencers/connect-twitter', { username });
      const { analytics } = response.data;
      set({
        twitterAnalytics: analytics,
        isTwitterConnected: true,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  fetchTwitterAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/influencers/twitter-analytics');
      if (response.data.analytics) {
        set({
          twitterAnalytics: response.data.analytics,
          isTwitterConnected: true,
          isLoading: false
        });
      } else {
        set({ isTwitterConnected: false, isLoading: false });
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        set({ error: 'Failed to fetch Twitter analytics.', isLoading: false });
      } else {
        set({ isTwitterConnected: false, isLoading: false });
      }
    }
  },

  clearError: () => set({ error: null }),
})); 