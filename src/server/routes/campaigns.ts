import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { campaigns, campaignParticipations, affiliates, tenants, users } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { generatePromoCode } from '@/lib/utils';

// Validation schemas
const campaignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  status: z.enum(['draft', 'active', 'paused', 'completed']).default('draft'),
  type: z.enum(['product', 'service', 'event']),
  metrics: z.object({
    totalReach: z.number(),
    engagementRate: z.number(),
    conversions: z.number(),
    revenue: z.number()
  }).default({
    totalReach: 0,
    engagementRate: 0,
    conversions: 0,
    revenue: 0
  })
});

export default async function campaignRoutes(fastify: FastifyInstance) {
  // Get all campaigns
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      console.log('User data:', {
        id: request.user.userId,
        role: request.user.role?.name,
        tenantId: request.user.tenantId
      });

      // Get user's role from database to ensure we have the latest role
      const userWithRole = await db.query.users.findFirst({
        where: eq(users.id, request.user.userId),
        with: {
          role: true
        }
      });

      console.log('User role from database:', userWithRole?.role?.roleName);

      // If user is an influencer or potential influencer, show all campaigns
      if (userWithRole?.role?.roleName === 'influencer' || userWithRole?.role?.roleName === 'potential_influencer') {
        console.log('User is an influencer, fetching all campaigns');
        
        // First, let's check if there are any campaigns in the database
        const campaignCount = await db.select({ count: sql<number>`count(*)` })
          .from(campaigns);
        console.log('Total campaigns in database:', campaignCount[0].count);

        const allCampaigns = await db.select({
          id: campaigns.id,
          name: campaigns.name,
          description: campaigns.description,
          startDate: campaigns.startDate,
          endDate: campaigns.endDate,
          status: campaigns.status,
          type: campaigns.type,
          metrics: campaigns.metrics,
          tenant: {
            name: tenants.tenantName,
            domain: tenants.domain
          }
        })
        .from(campaigns)
        .leftJoin(tenants, eq(campaigns.tenantId, tenants.id));

        console.log('Fetched campaigns for influencer:', allCampaigns);
        return reply.send(allCampaigns);
      }

      // For other users, show only their tenant's campaigns
      console.log('User is not an influencer, fetching tenant campaigns');
      const tenantCampaigns = await db.select({
        id: campaigns.id,
        name: campaigns.name,
        description: campaigns.description,
        startDate: campaigns.startDate,
        endDate: campaigns.endDate,
        status: campaigns.status,
        type: campaigns.type,
        metrics: campaigns.metrics,
        tenant: {
          name: tenants.tenantName,
          domain: tenants.domain
        }
      })
      .from(campaigns)
      .leftJoin(tenants, eq(campaigns.tenantId, tenants.id))
      .where(eq(campaigns.tenantId, request.user.tenantId));

      console.log('Fetched tenant campaigns:', tenantCampaigns);
      return reply.send(tenantCampaigns);
    } catch (error) {
      fastify.log.error('Error fetching campaigns:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch campaigns',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get campaign by ID
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params;
      const campaign = await db.select().from(campaigns)
        .where(and(
          eq(campaigns.id, id),
          eq(campaigns.tenantId, request.user.tenantId)
        ))
        .limit(1);

      if (!campaign.length) {
        return reply.status(404).send({ error: 'Campaign not found' });
      }

      return reply.send(campaign[0]);
    } catch (error) {
      fastify.log.error('Error fetching campaign:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch campaign',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create campaign
  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const result = campaignSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ 
          error: 'Validation error',
          details: result.error.format()
        });
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

      // Validate dates
      if (endDate && endDate <= startDate) {
        return reply.status(400).send({ error: 'End date must be after start date' });
      }

      const [newCampaign] = await db.insert(campaigns)
        .values({
          ...result.data,
          tenantId: request.user.tenantId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return reply.status(201).send(newCampaign);
    } catch (error) {
      fastify.log.error('Error creating campaign:', error);
      return reply.status(500).send({ 
        error: 'Failed to create campaign',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update campaign
  fastify.put('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params;
      const result = campaignSchema.partial().safeParse(request.body);
      
      if (!result.success) {
        return reply.status(400).send({ 
          error: 'Validation error',
          details: result.error.format()
        });
      }

      // Check if campaign exists and belongs to tenant
      const existingCampaign = await db.select()
        .from(campaigns)
        .where(and(
          eq(campaigns.id, id),
          eq(campaigns.tenantId, request.user.tenantId)
        ))
        .limit(1);

      if (!existingCampaign.length) {
        return reply.status(404).send({ error: 'Campaign not found' });
      }

      const { startDate, endDate } = result.data;
      if (startDate && endDate && endDate <= startDate) {
        return reply.status(400).send({ error: 'End date must be after start date' });
      }

      const [updatedCampaign] = await db.update(campaigns)
        .set({
          ...result.data,
          updatedAt: new Date()
        })
        .where(and(
          eq(campaigns.id, id),
          eq(campaigns.tenantId, request.user.tenantId)
        ))
        .returning();

      return reply.send(updatedCampaign);
    } catch (error) {
      fastify.log.error('Error updating campaign:', error);
      return reply.status(500).send({ 
        error: 'Failed to update campaign',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete campaign
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params;

      // Check if campaign exists and belongs to tenant
      const existingCampaign = await db.select()
        .from(campaigns)
        .where(and(
          eq(campaigns.id, id),
          eq(campaigns.tenantId, request.user.tenantId)
        ))
        .limit(1);

      if (!existingCampaign.length) {
        return reply.status(404).send({ error: 'Campaign not found' });
      }

      await db.delete(campaigns)
        .where(and(
          eq(campaigns.id, id),
          eq(campaigns.tenantId, request.user.tenantId)
        ));

      return reply.send({ message: 'Campaign deleted successfully' });
    } catch (error) {
      fastify.log.error('Error deleting campaign:', error);
      return reply.status(500).send({ 
        error: 'Failed to delete campaign',
        message: error instanceof Error ? error.message : 'Unknown error'
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

  // Get campaign participations for influencer
  fastify.get('/participations', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const participations = await db.select()
        .from(campaignParticipations)
        .where(eq(campaignParticipations.affiliateId, request.user.userId));

      return reply.send(participations);
    } catch (error) {
      fastify.log.error('Error fetching campaign participations:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch campaign participations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create new campaign participation
  fastify.post('/participations', async (request: FastifyRequest<{
    Body: {
      campaignId: string;
      metrics: {
        followers: number;
        engagement: number;
        reach: number;
      };
    }
  }>, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { campaignId, metrics } = request.body;

      // Check if user is an influencer
      const userWithRole = await db.query.users.findFirst({
        where: eq(users.id, request.user.userId),
        with: {
          role: true
        }
      });

      if (!userWithRole?.role?.roleName || 
          (userWithRole.role.roleName !== 'influencer' && userWithRole.role.roleName !== 'potential_influencer')) {
        return reply.status(403).send({ error: 'Only influencers can participate in campaigns' });
      }

      // Check if campaign exists
      const campaign = await db.select()
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1);

      if (!campaign.length) {
        return reply.status(404).send({ error: 'Campaign not found' });
      }

      // Check if already participating
      const existing = await db.select()
        .from(campaignParticipations)
        .where(and(
          eq(campaignParticipations.campaignId, campaignId),
          eq(campaignParticipations.affiliateId, request.user.userId)
        ))
        .limit(1);

      if (existing.length > 0) {
        return reply.status(400).send({ error: 'Already participating in this campaign' });
      }

      // Create new participation
      const participation = await db.insert(campaignParticipations)
        .values({
          campaignId,
          affiliateId: request.user.userId,
          tenantId: campaign[0].tenantId,
          status: 'pending',
          metrics: {
            reach: metrics.reach,
            engagement: metrics.engagement,
            clicks: 0,
            conversions: 0,
            revenue: 0
          },
          promotionalLinks: [],
          promotionalCodes: [],
          createdAt: new Date(),
          updatedAt: new Date()
        } as typeof campaignParticipations.$inferInsert)
        .returning();

      return reply.status(201).send(participation[0]);
    } catch (error) {
      fastify.log.error('Error creating campaign participation:', error);
      return reply.status(500).send({ 
        error: 'Failed to create campaign participation',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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

  // Test endpoint to create a sample campaign
  fastify.post('/test', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Create a test campaign
      const [campaign] = await db.insert(campaigns).values({
        tenantId: request.user.tenantId,
        name: 'Test Campaign',
        description: 'This is a test campaign',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'active',
        type: 'product',
        metrics: {
          totalReach: 0,
          engagementRate: 0,
          conversions: 0,
          revenue: 0
        }
      }).returning();

      console.log('Created test campaign:', campaign);
      return reply.send(campaign);
    } catch (error) {
      fastify.log.error('Error creating test campaign:', error);
      return reply.status(500).send({ 
        error: 'Failed to create test campaign',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}