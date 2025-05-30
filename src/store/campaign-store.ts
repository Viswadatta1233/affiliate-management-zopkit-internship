import { create } from 'zustand';
import { Campaign, CampaignParticipation } from '@/types';
import { api } from '@/lib/api';

type CampaignState = {
  campaigns: Campaign[];
  participations: CampaignParticipation[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadCampaigns: () => Promise<void>;
  loadParticipations: () => Promise<void>;
  optInToCampaign: (campaignId: string) => Promise<void>;
  getCampaignMetrics: (campaignId: string) => Promise<void>;
  clearError: () => void;
};

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  participations: [],
  isLoading: false,
  error: null,

  loadCampaigns: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/campaigns');
      const campaigns = response.data;
      
      // Convert date strings to Date objects
      const formattedCampaigns = campaigns.map((campaign: any) => ({
        ...campaign,
        startDate: new Date(campaign.startDate),
        endDate: campaign.endDate ? new Date(campaign.endDate) : null,
        createdAt: new Date(campaign.createdAt),
        updatedAt: new Date(campaign.updatedAt)
      }));
      
      set({ campaigns: formattedCampaigns, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load campaigns",
        isLoading: false
      });
    }
  },

  loadParticipations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/api/campaign-participations');
      const participations = response.data;
      
      // Convert date strings to Date objects
      const formattedParticipations = participations.map((participation: any) => ({
        ...participation,
        joinedAt: new Date(participation.joinedAt),
        completedAt: participation.completedAt ? new Date(participation.completedAt) : null
      }));
      
      set({ participations: formattedParticipations, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load participations",
        isLoading: false
      });
    }
  },

  optInToCampaign: async (campaignId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/api/campaigns/${campaignId}/opt-in`, {});
      const newParticipation = response.data;
      
      // Convert date strings to Date objects
      const formattedParticipation = {
        ...newParticipation,
        joinedAt: new Date(newParticipation.joinedAt),
        completedAt: newParticipation.completedAt ? new Date(newParticipation.completedAt) : null
      };

      set({
        participations: [...get().participations, formattedParticipation],
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to opt-in to campaign",
        isLoading: false
      });
    }
  },

  getCampaignMetrics: async (campaignId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/api/campaigns/${campaignId}/metrics`);
      const metrics = response.data;
      
      set({
        campaigns: get().campaigns.map(c => 
          c.id === campaignId 
            ? { ...c, metrics }
            : c
        ),
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to get campaign metrics",
        isLoading: false
      });
    }
  },

  clearError: () => set({ error: null })
}));