export const NICHE_OPTIONS = [
  { value: 'fashion', label: 'Fashion' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'health', label: 'Health' },
  { value: 'food', label: 'Food' },
  { value: 'travel', label: 'Travel' },
  { value: 'technology', label: 'Technology' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'education', label: 'Education' },
  { value: 'business', label: 'Business' },
  { value: 'finance', label: 'Finance' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'sports', label: 'Sports' },
  { value: 'music', label: 'Music' },
  { value: 'art', label: 'Art' },
  { value: 'photography', label: 'Photography' },
  { value: 'parenting', label: 'Parenting' },
  { value: 'home', label: 'Home & Decor' },
  { value: 'automotive', label: 'Automotive' }
] as const;

export const AGE_GROUP_OPTIONS = [
  { value: '13-17', label: '13-17 years' },
  { value: '18-24', label: '18-24 years' },
  { value: '25-34', label: '25-34 years' },
  { value: '35-44', label: '35-44 years' },
  { value: '45-54', label: '45-54 years' },
  { value: '55-64', label: '55-64 years' },
  { value: '65+', label: '65+ years' }
] as const;

export type Niche = typeof NICHE_OPTIONS[number]['value'];
export type AgeGroup = typeof AGE_GROUP_OPTIONS[number]['value']; 