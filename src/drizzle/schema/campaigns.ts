import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { tenants } from '@/drizzle/schema/tenants';

export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  name: text('name').notNull(),
  description: text('description').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  type: text('type', { enum: ['product', 'service', 'event'] }).notNull(),
  requirements: jsonb('requirements').notNull().default('{}'),
  rewards: jsonb('rewards').notNull(),
  content: jsonb('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
}); 