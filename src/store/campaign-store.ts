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
  joinCampaign: (campaignId: string) => Promise<void>;
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
      console.log('Loading campaigns...');
      const response = await api.get('/api/campaigns');
      console.log('Received campaigns:', response.data);
      
      // Convert date strings to Date objects and ensure all required fields
      const formattedCampaigns = response.data.map((campaign: any) => ({
        ...campaign,
        startDate: new Date(campaign.startDate),
        endDate: campaign.endDate ? new Date(campaign.endDate) : null,
        createdAt: new Date(campaign.createdAt),
        updatedAt: new Date(campaign.updatedAt),
        status: campaign.status || 'active', // Ensure status is set
        type: campaign.type || 'product', // Ensure type is set
        isJoined: false // Add isJoined flag
      }));
      
      console.log('Formatted campaigns:', formattedCampaigns);
      set({ campaigns: formattedCampaigns, isLoading: false });
    } catch (error: any) {
      console.error('Error in loadCampaigns:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : error?.response?.data?.error || "Failed to load campaigns";
      
      set({
        error: errorMessage,
        isLoading: false
      });
      throw error;
    }
  },

  loadParticipations: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Loading campaign participations...');
      const response = await api.get('/api/campaigns/participations');
      console.log('Received participations:', response.data);
      
      // Convert date strings to Date objects and ensure all required fields
      const formattedParticipations = response.data.map((participation: any) => ({
        ...participation,
        joinedAt: new Date(participation.joinedAt),
        completedAt: participation.completedAt ? new Date(participation.completedAt) : null,
        promotionalLinks: participation.promotionalLinks || [],
        promotionalCodes: participation.promotionalCodes || [],
        influencerName: participation.influencerName || 'Unknown'
      }));
      
      console.log('Formatted participations:', formattedParticipations);
      set({ participations: formattedParticipations, isLoading: false });
    } catch (error: any) {
      console.error('Error in loadParticipations:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : error?.response?.data?.error || "Failed to load participations";
      
      set({
        error: errorMessage,
        isLoading: false
      });
      throw error;
    }
  },

  joinCampaign: async (campaignId: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Joining campaign:', campaignId);
      const response = await api.post(`/api/campaigns/${campaignId}/join`, {});
      console.log('Join campaign response:', response.data);
      
      // Convert date strings to Date objects and ensure all required fields
      const formattedParticipation = {
        ...response.data,
        joinedAt: new Date(response.data.joinedAt),
        completedAt: response.data.completedAt ? new Date(response.data.completedAt) : null,
        promotionalLinks: response.data.promotionalLinks || [],
        promotionalCodes: response.data.promotionalCodes || [],
        influencerName: response.data.influencerName || 'Unknown'
      };

      console.log('Formatted participation:', formattedParticipation);
      
      // Update both campaigns and participations
      set(state => ({
        participations: [...state.participations, formattedParticipation],
        campaigns: state.campaigns.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, isJoined: true }
            : campaign
        ),
        isLoading: false
      }));
    } catch (error: any) {
      console.error('Error in joinCampaign:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : error?.response?.data?.error || "Failed to join campaign";
      
      set({
        error: errorMessage,
        isLoading: false
      });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));