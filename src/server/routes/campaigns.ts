import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '@/lib/db';
import { campaigns, campaignParticipations, affiliates } from '../../drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';
import { generatePromoCode } from '@/lib/utils';

const campaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).nullable().transform((val) => val ? new Date(val) : null),
  type: z.enum(['product', 'service', 'event']),
  requirements: z.object({
    minFollowers: z.number().optional(),
    platforms: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
  }).optional(),
  rewards: z.object({
    commissionRate: z.number().min(0).max(100),
    bonusThreshold: z.number().optional(),
    bonusAmount: z.number().optional(),
  }),
  content: z.object({
    images: z.array(z.string()),
    videos: z.array(z.string()),
    description: z.string().min(1, 'Content description is required'),
    guidelines: z.string().min(1, 'Guidelines are required'),
    promotionalCodes: z.array(z.string()),
  }),
});

export default async function campaignRoutes(fastify: FastifyInstance) {
  // Get all campaigns
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const allCampaigns = await db.select().from(campaigns)
      .where(eq(campaigns.tenantId, request.user.tenantId));
    return allCampaigns;
  });

  // Create campaign
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('Received campaign data:', request.body);
      console.log('User context:', request.user);
      
      if (!request.user?.tenantId) {
        console.error('No tenantId found in request');
        return reply.status(400).send({ error: 'Missing tenant ID' });
      }

      const result = campaignSchema.safeParse(request.body);
      if (!result.success) {
        console.error('Validation error:', result.error.format());
        return reply.status(400).send({ error: result.error.format() });
      }

      const { name, startDate, endDate } = result.data;

      // Check for duplicate campaign names
      const existingCampaign = await db.select()
        .from(campaigns)
        .where(and(
          eq(campaigns.tenantId, request.user.tenantId),
          eq(campaigns.name, name)
        ))
        .limit(1);

      if (existingCampaign.length > 0) {
        return reply.status(400).send({ error: 'Campaign with this name already exists' });
      }

      // Validate dates if endDate is provided
      if (endDate && endDate <= startDate) {
        return reply.status(400).send({ error: 'End date must be after start date' });
      }

      console.log('Inserting campaign with data:', {
        ...result.data,
        tenantId: request.user.tenantId
      });

      const campaign = await db.insert(campaigns)
        .values({
          name: result.data.name,
          description: result.data.description,
          startDate: startDate,
          endDate: endDate,
          type: result.data.type,
          requirements: result.data.requirements || {},
          rewards: result.data.rewards,
          content: result.data.content,
          tenantId: request.user.tenantId,
          createdAt: new Date(),
          updatedAt: new Date()
        } as typeof campaigns.$inferInsert)
        .returning();

      return campaign[0];
    } catch (error) {
      console.error('Error creating campaign:', error);
      return reply.status(500).send({ 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get campaign metrics
  fastify.get('/:id/metrics', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id: campaignId } = request.params;

    const participations = await db.select({
      count: sql<number>`count(*)`,
      completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
      rejected: sql<number>`sum(case when status = 'rejected' then 1 else 0 end)`
    })
    .from(campaignParticipations)
    .where(eq(campaignParticipations.campaignId, campaignId))
    .groupBy(campaignParticipations.campaignId);

    return participations[0] || {
      count: 0,
      completed: 0,
      pending: 0,
      rejected: 0
    };
  });

  // Get campaign participations
  fastify.get('/participations', async (request: FastifyRequest, reply: FastifyReply) => {
    const participations = await db.select()
      .from(campaignParticipations)
      .where(eq(campaignParticipations.affiliateId, request.user.id));
    return participations;
  });

  // Opt-in to campaign
  fastify.post('/:id/opt-in', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id: campaignId } = request.params;

    // Check if already participating
    const existing = await db.select()
      .from(campaignParticipations)
      .where(and(
        eq(campaignParticipations.campaignId, campaignId),
        eq(campaignParticipations.affiliateId, request.user.id)
      ))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(400).send({ error: 'Already participating in this campaign' });
    }

    // Get campaign details to check requirements
    const campaign = await db.select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign.length) {
      return reply.status(404).send({ error: 'Campaign not found' });
    }

    // Get affiliate details
    const affiliate = await db.select()
      .from(affiliates)
      .where(eq(affiliates.id, request.user.id))
      .limit(1);

    if (!affiliate.length) {
      return reply.status(404).send({ error: 'Affiliate not found' });
    }

    // Generate promo code
    const promoCode = generatePromoCode(campaign[0].name, request.user.id);

    const participation = await db.insert(campaignParticipations)
      .values({
        campaignId,
        affiliateId: request.user.id,
        tenantId: request.user.tenantId,
        status: 'pending',
        metrics: {
          reach: 0,
          engagement: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0
        },
        promotionalLinks: [],
        promotionalCodes: [promoCode],
        promoCode,
        createdAt: new Date(),
        updatedAt: new Date()
      } as typeof campaignParticipations.$inferInsert)
      .returning();

    return participation[0];
  });
}