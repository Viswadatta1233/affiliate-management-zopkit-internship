import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { campaigns, campaignParticipations, affiliates, tenants, users, influencers, roles } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { generatePromoCode } from '@/lib/utils';
import nodemailer from 'nodemailer';

// Validation schemas
const campaignSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
  status: z.enum(['draft', 'active', 'paused', 'completed']).default('draft'),
  type: z.enum(['product', 'service', 'event']),
  targetAudienceAgeGroup: z.string().min(1),
  requiredInfluencerNiche: z.string().min(1),
  basicGuidelines: z.string().min(1),
  preferredSocialMedia: z.string().min(1),
  marketingObjective: z.string().min(1),
  commissionRate: z.coerce.number().min(0).optional().nullable(),
  metrics: z.object({
    totalReach: z.number().default(0),
    engagementRate: z.number().default(0),
    conversions: z.number().default(0),
    revenue: z.number().default(0)
  }).default({
    totalReach: 0,
    engagementRate: 0,
    conversions: 0,
    revenue: 0
  })
});

interface UserWithRole {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: {
    id: string;
    roleName: string;
    description: string;
  };
}

// Create nodemailer transporter (reuse from affiliates.ts)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dattanidumukkala.98@gmail.com',
    pass: 'pbbmlywqphqiakpz',
  },
});

export default async function campaignRoutes(fastify: FastifyInstance) {
  // Get all campaigns (for influencer dashboard)
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      fastify.log.info('Fetching campaigns for user:', {
        userId: request.user.userId,
        tenantId: request.user.tenantId
      });

      // Get user's role from database
      const userWithRole = await db.query.users.findFirst({
        where: eq(users.id, request.user.userId),
        with: {
          role: true
        }
      }) as UserWithRole | null;

      fastify.log.info('User role:', userWithRole?.role?.roleName);

      // If user is an influencer or potential influencer, show all active campaigns
      if (userWithRole?.role?.roleName === 'influencer' || userWithRole?.role?.roleName === 'potential_influencer') {
        const allCampaigns = await db.select()
          .from(campaigns)
          .where(eq(campaigns.status, 'active'));
          console.log(allCampaigns);

        fastify.log.info('Found active campaigns for influencer:', allCampaigns.length);
        return reply.send(allCampaigns);
      }

      // For other users (admins), show only their tenant's campaigns
      const tenantCampaigns = await db.select()
        .from(campaigns)
        .where(eq(campaigns.tenantId, request.user.tenantId));

      fastify.log.info('Found tenant campaigns for admin:', tenantCampaigns.length);
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

      // Get user's role from database
      const userWithRole = await db.query.users.findFirst({
        where: eq(users.id, request.user.userId),
        with: { role: true }
      }) as UserWithRole | null;

      const { id } = request.params;
      let campaign;
      if (userWithRole?.role?.roleName === 'influencer' || userWithRole?.role?.roleName === 'potential_influencer') {
        // Influencer: fetch by ID only
        campaign = await db.select().from(campaigns)
          .where(eq(campaigns.id, id))
          .limit(1);
      } else {
        // Admin: fetch by ID and tenant
        campaign = await db.select().from(campaigns)
        .where(and(
          eq(campaigns.id, id),
          eq(campaigns.tenantId, request.user.tenantId)
        ))
        .limit(1);
      }

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

      const { name, startDate, endDate, requiredInfluencerNiche } = result.data;

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
          status: 'active',
          tenantId: request.user.tenantId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Notify influencers of this niche who have opted in
      const matchingInfluencers = await db.query.influencers.findMany({
        where: and(
          eq(influencers.niche, requiredInfluencerNiche),
          eq(influencers.allowNotificationForCampaign, true)
        ),
        with: { user: true }
      });
      for (const influencer of matchingInfluencers) {
        if (influencer.user?.email) {
          try {
            await transporter.sendMail({
              from: 'dattanidumukkala.98@gmail.com',
              to: influencer.user.email,
              subject: 'New Campaign in Your Niche!',
              html: `<p>A new campaign has been created in your niche (<b>${requiredInfluencerNiche}</b>).</p>
                     <p>Go to your website and check the details!</p>`
            });
          } catch (err) {
            fastify.log.error('Error sending campaign notification email:', err);
          }
        }
      }

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

  // Get campaign participations for a specific campaign (admin dashboard)
  fastify.get('/participations', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Get user's role from database
      const userWithRole = await db.query.users.findFirst({
        where: eq(users.id, request.user.userId),
        with: { role: true }
      });

      let participations;
      if (userWithRole?.role?.roleName === 'Tenant Admin' || userWithRole?.role?.roleName === 'super-admin') {
        // Admin: get all participations for campaigns of this tenant
        participations = await db.select({
          id: campaignParticipations.id,
          campaignId: campaignParticipations.campaignId,
          influencerId: campaignParticipations.influencerId,
          status: campaignParticipations.status,
          joinedAt: campaignParticipations.joinedAt,
          completedAt: campaignParticipations.completedAt,
          promotionalLinks: campaignParticipations.promotionalLinks,
          promotionalCodes: campaignParticipations.promotionalCodes,
          influencerName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`
        })
        .from(campaignParticipations)
        .leftJoin(users, eq(campaignParticipations.influencerId, users.id))
        .leftJoin(campaigns, eq(campaignParticipations.campaignId, campaigns.id))
        .where(eq(campaigns.tenantId, request.user.tenantId));
      } else {
        // Influencer: only their own participations
        participations = await db.select({
          id: campaignParticipations.id,
          campaignId: campaignParticipations.campaignId,
          influencerId: campaignParticipations.influencerId,
          status: campaignParticipations.status,
          joinedAt: campaignParticipations.joinedAt,
          completedAt: campaignParticipations.completedAt,
          promotionalLinks: campaignParticipations.promotionalLinks,
          promotionalCodes: campaignParticipations.promotionalCodes,
          influencerName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`
        })
        .from(campaignParticipations)
        .leftJoin(users, eq(campaignParticipations.influencerId, users.id))
        .where(eq(campaignParticipations.influencerId, request.user.userId));
      }

      return reply.send(participations);
    } catch (error) {
      fastify.log.error('Error fetching campaign participations:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch campaign participations',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Join campaign (influencer dashboard)
  fastify.post('/:id/join', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { id: campaignId } = request.params;

      // Check if user has influencer role
      const user = await db.select()
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.id, request.user.userId))
        .limit(1);

 
      // Check if influencer status is approved
      const influencer = await db.select()
        .from(influencers)
        .where(eq(influencers.userId, request.user.userId))
        .limit(1);

      if (!influencer.length || influencer[0].status !== 'approved') {
        return reply.status(403).send({ error: 'Only approved influencers can join campaigns (status check)' });
      }

      // Check if campaign exists and is active
      const campaign = await db.select()
        .from(campaigns)
        .where(and(
          eq(campaigns.id, campaignId),
          eq(campaigns.status, 'active')
        ))
        .limit(1);

      if (!campaign.length) {
        return reply.status(404).send({ error: 'Campaign not found or not active' });
      }

      // Check if already participating
      const existing = await db.select()
        .from(campaignParticipations)
        .where(and(
          eq(campaignParticipations.campaignId, campaignId),
          eq(campaignParticipations.influencerId, request.user.userId)
        ))
        .limit(1);

      if (existing.length > 0) {
        return reply.status(400).send({ error: 'Already participating in this campaign' });
      }

      // Generate promotional code and link
      const promoCode = generatePromoCode(campaign[0].name, request.user.userId);
      const promoLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/campaign/${campaignId}?ref=${promoCode}`;

      // Create participation
      const [participation] = await db.insert(campaignParticipations)
        .values({
          campaignId,
          influencerId: request.user.userId,
          tenantId: campaign[0].tenantId,
          status: 'active',
          promotionalLinks: [promoLink],
          promotionalCodes: [promoCode],
          joinedAt: new Date()
        })
        .returning();

      return reply.status(201).send({
        ...participation,
        influencerName: `${user[0].firstName} ${user[0].lastName}`
      });
    } catch (error) {
      fastify.log.error('Error joining campaign:', error);
      return reply.status(500).send({ 
        error: 'Failed to join campaign',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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