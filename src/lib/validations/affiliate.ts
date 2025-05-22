import { z } from 'zod';

// Social media format
const socialMediaSchema = z.object({
  facebook: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  twitter: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  linkedin: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  instagram: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  youtube: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  tiktok: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal(''))
});

// Affiliate profile schema
export const affiliateProfileSchema = z.object({
  company_name: z.string().optional(),
  website_url: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  social_media: socialMediaSchema,
  tax_id: z.string().optional(),
  tax_form_type: z.enum(['W9', 'W8BEN', 'other']).optional(),
  payment_threshold: z.number().min(1, { message: 'Threshold must be at least 1' }),
  preferred_currency: z.string().length(3, { message: 'Please select a valid currency' }),
  promotional_methods: z.array(z.string()).min(1, { message: 'Please select at least one promotional method' })
});

// Tracking link schema
export const trackingLinkSchema = z.object({
  destination_url: z.string().url({ message: 'Must be a valid URL' }),
  campaign_name: z.string().min(3, { message: 'Campaign name must be at least 3 characters' }),
  utm_medium: z.string(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
  expires_at: z.date().optional().nullable()
});

// Commission tier schema
export const commissionTierSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  level: z.number().int().min(1, { message: 'Level must be at least 1' }),
  base_commission_rate: z.number().min(0, { message: 'Rate must be at least 0' }).max(100, { message: 'Rate cannot exceed 100' }),
  rollover_rate: z.number().min(0, { message: 'Rate must be at least 0' }).max(100, { message: 'Rate cannot exceed 100' }),
  min_monthly_sales: z.number().min(0, { message: 'Must be at least 0' }),
  min_active_referrals: z.number().int().min(0, { message: 'Must be at least 0' }),
  bonus_threshold: z.number().optional().nullable(),
  bonus_amount: z.number().optional().nullable(),
  recurring_commission: z.boolean().default(false),
  recurring_duration: z.number().int().min(0, { message: 'Must be at least 0' }).max(36, { message: 'Cannot exceed 36 months' }),
  status: z.enum(['active', 'inactive']),
  effective_date: z.date(),
  expiry_date: z.date().optional().nullable()
});

// Product-specific commission schema
export const productCommissionSchema = z.object({
  product_id: z.string(),
  product_name: z.string(),
  category_id: z.string().optional().nullable(),
  commission_type: z.enum(['percentage', 'fixed']),
  commission_value: z.number().min(0, { message: 'Value must be at least 0' }),
  tier_overrides: z.record(z.string(), z.number()),
  start_date: z.date(),
  end_date: z.date().optional().nullable(),
  min_quantity: z.number().int().min(1, { message: 'Must be at least 1' }),
  max_quantity: z.number().int().optional().nullable(),
  status: z.enum(['active', 'inactive'])
});

// Payout request schema
export const payoutRequestSchema = z.object({
  amount: z.number().min(1, { message: 'Amount must be at least 1' }),
  currency: z.string().length(3, { message: 'Please select a valid currency' }),
  payment_method_id: z.string().uuid({ message: 'Please select a valid payment method' })
});