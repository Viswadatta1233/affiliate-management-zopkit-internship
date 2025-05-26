import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { commissionTiers, products, commissionRules } from '../db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';

const commissionTierSchema = z.object({
  tierName: z.string().min(1),
  commissionPercent: z.coerce.number().min(0).max(100),
  minSales: z.coerce.number().int().min(0),
});

const commissionRuleSchema = z.object({
  ruleName: z.string().min(1),
  description: z.string().optional(),
  ruleType: z.enum(['product', 'category', 'tier']),
  condition: z.string().min(1),
  value: z.coerce.number(),
  valueType: z.string().min(1),
  isActive: z.boolean(),
  priority: z.coerce.number().int(),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
});

export async function commissionRoutes(server: FastifyInstance) {
  // Get commission tiers
  server.get('/tiers', async (request, reply) => {
    const user = request.user;
    if (!user?.tenantId) return reply.status(401).send({ error: 'Unauthorized' });
    const tiers = await db.select().from(commissionTiers).where(eq(commissionTiers.tenantId, user.tenantId));
    // Map to snake_case for frontend
    return tiers.map(tier => ({
      id: tier.id,
      tier_name: tier.tierName,
      commission_percent: parseFloat(tier.commissionPercent),
      min_sales: tier.minSales,
      created_at: tier.createdAt
    }));
  });

  // Create commission tier
  server.post('/tiers', async (request, reply) => {
    const user = request.user;
    if (!user?.tenantId) return reply.status(401).send({ error: 'Unauthorized' });
    const schema = z.object({
      tier_name: z.string().min(1, 'Tier name is required'),
      commission_percent: z.coerce.number().min(0, 'Commission must be at least 0').max(100, 'Commission cannot exceed 100'),
      min_sales: z.coerce.number().min(0, 'Minimum sales must be at least 0'),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });
    const [tier] = await db.insert(commissionTiers).values({
      tenantId: user.tenantId,
      tierName: body.data.tier_name,
      commissionPercent: body.data.commission_percent.toString(),
      minSales: body.data.min_sales,
    }).returning();
    // Map to snake_case for frontend
    return reply.status(201).send({
      id: tier.id,
      tier_name: tier.tierName,
      commission_percent: parseFloat(tier.commissionPercent),
      min_sales: tier.minSales,
      created_at: tier.createdAt
    });
  });

  // Update commission tier
  server.put('/tiers/:id', async (request, reply) => {
    const user = request.user;
    if (!user?.tenantId) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const schema = z.object({
      tier_name: z.string().min(1, 'Tier name is required'),
      commission_percent: z.coerce.number().min(0, 'Commission must be at least 0').max(100, 'Commission cannot exceed 100'),
      min_sales: z.coerce.number().min(0, 'Minimum sales must be at least 0'),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });
    const [tier] = await db.update(commissionTiers)
      .set({
        tierName: body.data.tier_name,
        commissionPercent: body.data.commission_percent.toString(),
        minSales: body.data.min_sales,
      })
      .where(and(eq(commissionTiers.id, id), eq(commissionTiers.tenantId, user.tenantId)))
      .returning();
    if (!tier) return reply.status(404).send({ error: 'Tier not found' });
    // Map to snake_case for frontend
    return {
      id: tier.id,
      tier_name: tier.tierName,
      commission_percent: parseFloat(tier.commissionPercent),
      min_sales: tier.minSales,
      created_at: tier.createdAt
    };
  });

  // Delete commission tier
  server.delete('/tiers/:id', async (request, reply) => {
    const user = request.user;
    if (!user?.tenantId) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const [tier] = await db.delete(commissionTiers)
      .where(and(eq(commissionTiers.id, id), eq(commissionTiers.tenantId, user.tenantId)))
      .returning();
    if (!tier) return reply.status(404).send({ error: 'Tier not found' });
    return tier;
  });

  // List all products with commission_percent set for the tenant
  server.get('/products', async (request, reply) => {
    const user = request.user;
    if (!user?.tenantId) return reply.status(401).send({ error: 'Unauthorized' });
    const prods = await db.select().from(products)
      .where(and(eq(products.tenantId, user.tenantId), isNotNull(products.commissionPercent)));
    return prods;
  });

  // Update commission_percent for a product
  server.put('/products/:id', async (request, reply) => {
    const user = request.user;
    if (!user?.tenantId) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const schema = z.object({ commissionPercent: z.coerce.number().min(0).max(100) });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });
    const [prod] = await db.update(products)
      .set({ commissionPercent: body.data.commissionPercent.toString() })
      .where(and(eq(products.id, id), eq(products.tenantId, user.tenantId)))
      .returning();
    if (!prod) return reply.status(404).send({ error: 'Product not found' });
    return prod;
  });

  // Get commission rules
  server.get('/rules', async (request, reply) => {
    const user = request.user;
    if (!user?.tenantId) return reply.status(401).send({ error: 'Unauthorized' });
    const rules = await db.select().from(commissionRules).where(eq(commissionRules.tenantId, user.tenantId));
    // Map to snake_case for frontend
    return rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      condition: rule.condition,
      value: parseFloat(rule.value),
      value_type: rule.valueType,
      status: rule.status,
      priority: rule.priority,
      start_date: rule.startDate?.toISOString().slice(0, 10),
      end_date: rule.endDate ? rule.endDate.toISOString().slice(0, 10) : '',
      created_at: rule.createdAt
    }));
  });

  // Create commission rule
  server.post('/rules', async (request, reply) => {
    const user = request.user;
    if (!user?.tenantId) return reply.status(401).send({ error: 'Unauthorized' });
    const schema = z.object({
      name: z.string().min(1, 'Rule name is required'),
      description: z.string().optional(),
      type: z.string().min(1, 'Type is required'),
      condition: z.string().min(1, 'Condition is required'),
      value: z.coerce.number(),
      value_type: z.string().min(1, 'Value type is required'),
      status: z.string().min(1, 'Status is required'),
      priority: z.coerce.number().int(),
      start_date: z.string().min(1, 'Start date is required'),
      end_date: z.string().optional().nullable(),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });
    const [rule] = await db.insert(commissionRules).values({
      tenantId: user.tenantId,
      name: body.data.name,
      description: body.data.description,
      type: body.data.type,
      condition: body.data.condition,
      value: body.data.value.toString(),
      valueType: body.data.value_type,
      status: body.data.status,
      priority: body.data.priority,
      startDate: new Date(body.data.start_date),
      endDate: body.data.end_date ? new Date(body.data.end_date) : undefined,
    }).returning();
    // Map to snake_case for frontend
    return reply.status(201).send({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      condition: rule.condition,
      value: parseFloat(rule.value),
      value_type: rule.valueType,
      status: rule.status,
      priority: rule.priority,
      start_date: rule.startDate?.toISOString().slice(0, 10),
      end_date: rule.endDate ? rule.endDate.toISOString().slice(0, 10) : '',
      created_at: rule.createdAt
    });
  });

  // Update commission rule
  server.put('/rules/:id', async (request, reply) => {
    const user = request.user;
    if (!user?.tenantId) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const schema = z.object({
      name: z.string().min(1, 'Rule name is required'),
      description: z.string().optional(),
      type: z.string().min(1, 'Type is required'),
      condition: z.string().min(1, 'Condition is required'),
      value: z.coerce.number(),
      value_type: z.string().min(1, 'Value type is required'),
      status: z.string().min(1, 'Status is required'),
      priority: z.coerce.number().int(),
      start_date: z.string().min(1, 'Start date is required'),
      end_date: z.string().optional().nullable(),
    });
    const body = schema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });
    const [rule] = await db.update(commissionRules)
      .set({
        name: body.data.name,
        description: body.data.description,
        type: body.data.type,
        condition: body.data.condition,
        value: body.data.value.toString(),
        valueType: body.data.value_type,
        status: body.data.status,
        priority: body.data.priority,
        startDate: new Date(body.data.start_date),
        endDate: body.data.end_date ? new Date(body.data.end_date) : undefined,
      })
      .where(and(eq(commissionRules.id, id), eq(commissionRules.tenantId, user.tenantId)))
      .returning();
    if (!rule) return reply.status(404).send({ error: 'Rule not found' });
    // Map to snake_case for frontend
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      condition: rule.condition,
      value: parseFloat(rule.value),
      value_type: rule.valueType,
      status: rule.status,
      priority: rule.priority,
      start_date: rule.startDate?.toISOString().slice(0, 10),
      end_date: rule.endDate ? rule.endDate.toISOString().slice(0, 10) : '',
      created_at: rule.createdAt
    };
  });

  // Delete commission rule
  server.delete('/rules/:id', async (request, reply) => {
    const user = request.user;
    if (!user?.tenantId) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const [rule] = await db.delete(commissionRules)
      .where(and(eq(commissionRules.id, id), eq(commissionRules.tenantId, user.tenantId)))
      .returning();
    if (!rule) return reply.status(404).send({ error: 'Rule not found' });
    return rule;
  });
}