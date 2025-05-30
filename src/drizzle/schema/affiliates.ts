import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants } from './tenants';
import { users } from './users';

export const affiliates = pgTable('affiliates', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  status: text('status', { enum: ['pending', 'active', 'suspended'] }).notNull(),
  bio: text('bio'),
  socialLinks: jsonb('social_links').notNull().default({}),
  metrics: jsonb('metrics').notNull().default({
    followers: 0,
    engagementRate: 0,
    totalEarnings: 0
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}); 