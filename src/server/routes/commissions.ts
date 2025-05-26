import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { commissionTiers, products, commissionRules, affiliateProductCommissions, users } from '../db/schema';
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

export const commissionRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all commission tiers for tenant
  fastify.get('/tiers', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const tenantId = request.user.tenantId;

      // Fetch all commission tiers for this tenant
      const tiers = await db.query.commissionTiers.findMany({
        where: eq(commissionTiers.tenantId, tenantId),
        orderBy: (tier) => tier.minSales
      });

      // For each tier, fetch the associated affiliates
      const tiersWithAffiliates = await Promise.all(
        tiers.map(async (tier) => {
          try {
            // Get all affiliate commissions for this tier
            const affiliateCommissions = await db
              .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email
              })
              .from(affiliateProductCommissions)
              .innerJoin(users, eq(affiliateProductCommissions.affiliateId, users.id))
              .where(
                and(
                  eq(affiliateProductCommissions.commissionTierId, tier.id),
                  eq(affiliateProductCommissions.tenantId, tenantId),
                  eq(users.isAffiliate, true)
                )
              );

            // Get unique affiliates
            const uniqueAffiliates = Array.from(
              new Map(affiliateCommissions.map(aff => [aff.id, aff])).values()
            );

            return {
              id: tier.id,
              tierName: tier.tierName,
              commissionPercent: tier.commissionPercent,
              minSales: tier.minSales,
              createdAt: tier.createdAt,
              affiliates: uniqueAffiliates,
              affiliateCount: uniqueAffiliates.length
            };
          } catch (error) {
            fastify.log.error(`Error fetching affiliates for tier ${tier.id}:`, error);
            // Return tier without affiliate information if there's an error
            return {
              id: tier.id,
              tierName: tier.tierName,
              commissionPercent: tier.commissionPercent,
              minSales: tier.minSales,
              createdAt: tier.createdAt,
              affiliates: [],
              affiliateCount: 0
            };
          }
        })
      );

      return tiersWithAffiliates;
    } catch (error) {
      fastify.log.error('Error fetching commission tiers:', error);
      return reply.status(500).send({ error: 'Failed to fetch commission tiers' });
    }
  });

  // Create new commission tier
  fastify.post('/tiers', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const tenantId = request.user.tenantId;
      const { tierName, commissionPercent, minSales } = request.body as {
        tierName: string;
        commissionPercent: number;
        minSales: number;
      };

      const [tier] = await db.insert(commissionTiers).values({
        tenantId,
        tierName,
        commissionPercent: commissionPercent.toString(),
        minSales
      }).returning();

      return tier;
    } catch (error) {
      fastify.log.error('Error creating commission tier:', error);
      return reply.status(500).send({ error: 'Failed to create commission tier' });
    }
  });

  // Update commission tier
  fastify.put('/tiers/:id', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const tenantId = request.user.tenantId;
      const tierId = (request.params as { id: string }).id;
      const { tierName, commissionPercent, minSales } = request.body as {
        tierName: string;
        commissionPercent: number;
        minSales: number;
      };

      const [tier] = await db.update(commissionTiers)
        .set({
          tierName,
          commissionPercent: commissionPercent.toString(),
          minSales
        })
        .where(eq(commissionTiers.id, tierId))
        .returning();

      if (!tier) {
        return reply.status(404).send({ error: 'Commission tier not found' });
      }

      return tier;
    } catch (error) {
      fastify.log.error('Error updating commission tier:', error);
      return reply.status(500).send({ error: 'Failed to update commission tier' });
    }
  });

  // Delete commission tier
  fastify.delete('/tiers/:id', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const tenantId = request.user.tenantId;
      const tierId = (request.params as { id: string }).id;

      const [tier] = await db.delete(commissionTiers)
        .where(eq(commissionTiers.id, tierId))
        .returning();

      if (!tier) {
        return reply.status(404).send({ error: 'Commission tier not found' });
      }

      return { message: 'Commission tier deleted successfully' };
    } catch (error) {
      fastify.log.error('Error deleting commission tier:', error);
      return reply.status(500).send({ error: 'Failed to delete commission tier' });
    }
  });

  // List all products with commission_percent set for the tenant
  fastify.get('/products', async (request, reply) => {
    const user = request.user;
    if (!user?.tenantId) return reply.status(401).send({ error: 'Unauthorized' });
    const prods = await db.select().from(products)
      .where(and(eq(products.tenantId, user.tenantId), isNotNull(products.commissionPercent)));
    return prods;
  });

  // Update commission_percent for a product
  fastify.put('/products/:id', async (request, reply) => {
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
  fastify.get('/rules', async (request, reply) => {
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
  fastify.post('/rules', async (request, reply) => {
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
  fastify.put('/rules/:id', async (request, reply) => {
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
  fastify.delete('/rules/:id', async (request, reply) => {
    const user = request.user;
    if (!user?.tenantId) return reply.status(401).send({ error: 'Unauthorized' });
    const { id } = request.params as { id: string };
    const [rule] = await db.delete(commissionRules)
      .where(and(eq(commissionRules.id, id), eq(commissionRules.tenantId, user.tenantId)))
      .returning();
    if (!rule) return reply.status(404).send({ error: 'Rule not found' });
    return rule;
  });
};