import { z } from 'zod';

// Tenant creation schema
export const tenantSchema = z.object({
  tenant_name: z.string().min(3, {
    message: 'Tenant name must be at least 3 characters.',
  }).max(255),
  domain: z.string().min(4, {
    message: 'Domain must be valid.',
  }).max(255).optional(),
  subdomain: z.string().min(3, {
    message: 'Subdomain must be at least 3 characters.',
  }).max(100)
    .regex(/^[a-z0-9-]+$/, {
      message: 'Subdomain can only contain lowercase letters, numbers, and hyphens.',
    }),
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, {
    message: 'Must be a valid hex color code.',
  }),
  secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i, {
    message: 'Must be a valid hex color code.',
  }),
  subscription_tier: z.enum(['free', 'starter', 'professional', 'enterprise']),
  max_users: z.number().int().positive(),
  max_affiliates: z.number().int().positive()
});

// User registration schema
export const registerSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }).refine(password => {
    return /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  }, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
  }),
  confirm_password: z.string(),
  first_name: z.string().min(2, {
    message: 'First name must be at least 2 characters.',
  }).max(100),
  last_name: z.string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }).max(100),
  phone: z.string().optional(),
  country_code: z.string().length(2, {
    message: 'Please select a country.',
  }),
  timezone: z.string(),
  language: z.string().length(2, {
    message: 'Please select a language.',
  }),
  referral_code: z.string().optional(),
  terms_accepted: z.boolean().refine(value => value === true, {
    message: 'You must accept the terms and conditions.',
  }),
  marketing_consent: z.boolean().optional()
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match.',
  path: ['confirm_password']
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(1, {
    message: 'Please enter your password.',
  }),
  remember: z.boolean().optional(),
  tenant: z.string().optional()
});

// Password reset request schema
export const forgotPasswordSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  })
});

// Password reset schema
export const resetPasswordSchema = z.object({
  password: z.string().min(8, {
    message: 'Password must be at least 8 characters.',
  }).refine(password => {
    return /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  }, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
  }),
  confirm_password: z.string()
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match.',
  path: ['confirm_password']
});

// Profile update schema
export const profileUpdateSchema = z.object({
  first_name: z.string().min(2, {
    message: 'First name must be at least 2 characters.',
  }).max(100),
  last_name: z.string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }).max(100),
  phone: z.string().optional(),
  country_code: z.string().length(2, {
    message: 'Please select a country.',
  }),
  timezone: z.string(),
  language: z.string().length(2, {
    message: 'Please select a language.',
  }),
  marketing_consent: z.boolean().optional()
});