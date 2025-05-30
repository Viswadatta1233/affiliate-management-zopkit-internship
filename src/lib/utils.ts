import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a promotional code from a campaign name and affiliate ID
 * Format: CAMP1234 (first 4 letters of campaign name + first 4 chars of affiliate ID)
 */
export function generatePromoCode(campaignName: string, affiliateId: string): string {
  const prefix = campaignName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 4)
    .toUpperCase();
  const suffix = affiliateId.substring(0, 4).toUpperCase();
  return `${prefix}${suffix}`;
}
