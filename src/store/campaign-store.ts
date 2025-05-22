import { create } from 'zustand';
import { Campaign, CampaignParticipation } from '@/types';
import { api } from '@/lib/api';

// Sample campaign data
const sampleCampaigns: Campaign[] = [
  {
    id: '1',
    tenantId: 'demo-tenant-id',
    name: 'Summer Fashion Collection 2025',
    description: 'Promote our latest summer fashion collection with exclusive discounts for your followers.',
    startDate: new Date('2025-06-01'),
    endDate: new Date('2025-08-31'),
    status: 'active',
    type: 'product',
    requirements: {
      minFollowers: 5000,
      platforms: ['instagram', 'tiktok'],
      categories: ['fashion', 'lifestyle']
    },
    rewards: {
      commissionRate: 15,
      bonusThreshold: 10000,
      bonusAmount: 500
    },
    content: {
      images: [
        'https://images.pexels.com/photos/994523/pexels-photo-994523.jpeg',
        'https://images.pexels.com/photos/1126993/pexels-photo-1126993.jpeg'
      ],
      videos: ['https://example.com/summer-collection.mp4'],
      description: 'Experience the vibrant colors and breezy styles of our Summer 2025 collection.',
      guidelines: 'Share authentic styling tips and showcase the versatility of our pieces.',
      promotionalCodes: ['SUMMER25', 'INFLUENCER20']
    },
    metrics: {
      totalReach: 25000,
      engagementRate: 4.5,
      conversions: 150,
      revenue: 7500
    },
    createdAt: new Date('2025-05-15'),
    updatedAt: new Date('2025-05-15')
  },
  {
    id: '2',
    tenantId: 'demo-tenant-id',
    name: 'Back to School Tech Bundle',
    description: 'Help students gear up for the new academic year with our tech essentials bundle.',
    startDate: new Date('2025-07-15'),
    endDate: new Date('2025-09-15'),
    status: 'active',
    type: 'product',
    requirements: {
      minFollowers: 3000,
      platforms: ['youtube', 'instagram'],
      categories: ['tech', 'education']
    },
    rewards: {
      commissionRate: 12,
      bonusThreshold: 15000,
      bonusAmount: 750
    },
    content: {
      images: [
        'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg',
        'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg'
      ],
      videos: ['https://example.com/tech-bundle.mp4'],
      description: 'The ultimate tech bundle for students featuring our best-selling laptop, tablet, and accessories.',
      guidelines: 'Create detailed unboxing videos and showcase productivity features.',
      promotionalCodes: ['SCHOOL25', 'STUDENT20']
    },
    metrics: {
      totalReach: 18000,
      engagementRate: 3.8,
      conversions: 85,
      revenue: 12750
    },
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date('2025-06-01')
  },
  {
    id: '3',
    tenantId: 'demo-tenant-id',
    name: 'Fitness Challenge 2025',
    description: 'Join our 30-day fitness challenge and promote our premium workout gear.',
    startDate: new Date('2025-08-01'),
    endDate: new Date('2025-08-31'),
    status: 'active',
    type: 'event',
    requirements: {
      minFollowers: 10000,
      platforms: ['instagram', 'tiktok', 'youtube'],
      categories: ['fitness', 'health']
    },
    rewards: {
      commissionRate: 20,
      bonusThreshold: 20000,
      bonusAmount: 1000
    },
    content: {
      images: [
        'https://images.pexels.com/photos/2294361/pexels-photo-2294361.jpeg',
        'https://images.pexels.com/photos/2294362/pexels-photo-2294362.jpeg'
      ],
      videos: ['https://example.com/fitness-challenge.mp4'],
      description: 'Transform your fitness journey with our premium workout gear and expert-designed challenge.',
      guidelines: 'Share daily workout routines and progress updates using our products.',
      promotionalCodes: ['FIT25', 'CHALLENGE20']
    },
    metrics: {
      totalReach: 45000,
      engagementRate: 6.2,
      conversions: 220,
      revenue: 16500
    },
    createdAt: new Date('2025-07-15'),
    updatedAt: new Date('2025-07-15')
  }
];

const sampleParticipations: CampaignParticipation[] = [
  {
    id: '1',
    campaignId: '1',
    affiliateId: 'demo-affiliate-id',
    status: 'active',
    metrics: {
      reach: 12000,
      engagement: 4.8,
      clicks: 850,
      conversions: 75,
      revenue: 3750
    },
    promotionalLinks: ['https://example.com/ref/summer25'],
    promotionalCodes: ['SUMMER25'],
    joinedAt: new Date('2025-06-01'),
    completedAt: null
  }
];

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
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      set({ campaigns: sampleCampaigns, isLoading: false });
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
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      set({ participations: sampleParticipations, isLoading: false });
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
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      const newParticipation: CampaignParticipation = {
        id: `participation-${Date.now()}`,
        campaignId,
        affiliateId: 'demo-affiliate-id',
        status: 'active',
        metrics: {
          reach: 0,
          engagement: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        },
        promotionalLinks: [`https://example.com/ref/${campaignId}`],
        promotionalCodes: [`CODE${Math.random().toString(36).substring(7).toUpperCase()}`],
        joinedAt: new Date(),
        completedAt: null
      };

      set({
        participations: [...get().participations, newParticipation],
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
      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      const campaign = get().campaigns.find(c => c.id === campaignId);
      if (!campaign) throw new Error('Campaign not found');

      // Simulate updating metrics
      const updatedMetrics = {
        ...campaign.metrics,
        totalReach: campaign.metrics.totalReach + Math.floor(Math.random() * 1000),
        conversions: campaign.metrics.conversions + Math.floor(Math.random() * 10)
      };

      set({
        campaigns: get().campaigns.map(c => 
          c.id === campaignId 
            ? { ...c, metrics: updatedMetrics }
            : c
        ),
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load campaign metrics",
        isLoading: false
      });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));