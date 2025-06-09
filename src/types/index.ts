// Existing types...

// Campaign Management
export interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  status: string;
  type: string;
  targetAudienceAgeGroup: string;
  requiredInfluencerNiche: string;
  basicGuidelines: string;
  preferredSocialMedia: string;
  marketingObjective: string;
  metrics: {
    totalReach: number;
    engagementRate: number;
    conversions: number;
    revenue: number;
  };
  rewards?: {
    commissionRate: number;
    bonusAmount?: number;
    bonusThreshold?: number;
  };
  requirements?: {
    minFollowers?: number;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type CampaignParticipation = {
  id: string;
  campaignId: string;
  influencerId: string;
  status: 'active' | 'completed' | 'pending' | 'rejected';
  promotionalLinks: string[];
  promotionalCodes: string[];
  joinedAt: Date;
  completedAt: Date | null;
  influencerName?: string;
};

// Add to existing types...

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  tenantId: string;
  isAffiliate?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  tenantName: string;
  domain: string;
  subdomain: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  subscriptionTier: string;
  maxUsers: number;
  status: string;
  settings: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
}

export interface Role {
  id: string;
  tenantId: string;
  roleName: string;
  description?: string;
  isCustom: boolean;
  createdBy?: string;
  createdAt: Date;
}

export interface Affiliate {
  id: string;
  tenantId: string;
  userId: string;
  referralCode: string;
  currentTierId: string;
  parentAffiliateId?: string;
  companyName: string;
  websiteUrl: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
  taxId?: string;
  taxFormType?: string;
  paymentThreshold: number;
  preferredCurrency: string;
  promotionalMethods: string[];
  status: string;
  approvedBy: string;
  approvedAt: Date;
  user: User;
}

export interface TrackingLink {
  id: string;
  tenantId: string;
  affiliateId: string;
  destinationUrl: string;
  campaignName: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent?: string;
  utmTerm?: string;
  shortCode: string;
  qrCodeUrl?: string;
  status: string;
  expiresAt?: Date;
  clickCount: number;
  conversionCount: number;
  createdAt: Date;
}

export interface Commission {
  id: string;
  tenantId: string;
  affiliateId: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  referenceId: string;
  description?: string;
  createdAt: Date;
  paidAt?: Date;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  currency: string;
  sku: string;
  commission_percent: number;
  category?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}