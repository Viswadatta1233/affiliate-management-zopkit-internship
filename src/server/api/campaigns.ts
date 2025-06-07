import { Router, Response, RequestHandler } from 'express';
import { z } from 'zod';
import { auth, AuthenticatedRequest, AuthenticatedRequestHandler } from '@/lib/auth';
import { db } from '../db';
import { campaigns, campaignParticipations, users, influencers } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { generatePromoCode } from '@/lib/utils';

const router = Router();

const campaignSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  type: z.enum(['referral', 'affiliate']),
  requirements: z.record(z.any()),
  rewards: z.record(z.any()),
  content: z.record(z.any())
});

// Type-safe request handlers
const getAllCampaigns: AuthenticatedRequestHandler = async (req, res) => {
  const allCampaigns = await db.select().from(campaigns)
    .where(eq(campaigns.tenantId, req.user.tenantId));
  res.json(allCampaigns);
};

const createCampaign: AuthenticatedRequestHandler = async (req, res) => {
  const result = campaignSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  const { name, startDate, endDate } = result.data;

  // Check for duplicate campaign names
  const existingCampaign = await db.select()
    .from(campaigns)
    .where(and(
      eq(campaigns.tenantId, req.user.tenantId),
      eq(campaigns.name, name)
    ))
    .limit(1);

  if (existingCampaign.length > 0) {
    return res.status(400).json({ error: 'Campaign with this name already exists' });
  }

  // Validate dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) {
    return res.status(400).json({ error: 'End date must be after start date' });
  }

  const campaign = await db.insert(campaigns)
    .values({
      name: result.data.name,
      description: result.data.description,
      startDate: start,
      endDate: end,
      type: result.data.type,
      requirements: result.data.requirements,
      rewards: result.data.rewards,
      content: result.data.content,
      tenantId: req.user.tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    } as typeof campaigns.$inferInsert)
    .returning();

  res.json(campaign[0]);
};

const getCampaignMetrics: AuthenticatedRequestHandler = async (req, res) => {
  const campaignId = req.params.id;

  const participations = await db.select({
    count: sql<number>`count(*)`,
    completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
    pending: sql<number>`sum(case when status = 'pending' then 1 else 0 end)`,
    rejected: sql<number>`sum(case when status = 'rejected' then 1 else 0 end)`
  })
  .from(campaignParticipations)
  .where(eq(campaignParticipations.campaignId, campaignId))
  .groupBy(campaignParticipations.campaignId);

  const metrics = participations[0] || {
    count: 0,
    completed: 0,
    pending: 0,
    rejected: 0
  };

  res.json(metrics);
};

const getCampaignParticipations: AuthenticatedRequestHandler = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log('Fetching participations for user:', req.user.id);

    const participations = await db.select({
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
    .where(eq(campaignParticipations.influencerId, req.user.id));

    console.log('Found participations:', participations.length);

    res.json(participations);
  } catch (error) {
    console.error('Error fetching participations:', error);
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: 'Failed to fetch participations',
        details: error.message
      });
    }
    res.status(500).json({ error: 'Failed to fetch participations' });
  }
};

const joinCampaign: AuthenticatedRequestHandler = async (req, res) => {
  try {
    const campaignId = req.params.id;

    // Check if user is an approved influencer
    const influencer = await db.select()
      .from(influencers)
      .where(eq(influencers.userId, req.user.id))
      .limit(1);

    if (!influencer.length || influencer[0].status !== 'approved') {
      return res.status(403).json({ error: 'Only approved influencers can join campaigns' });
    }

    // Check if already participating
    const existing = await db.select()
      .from(campaignParticipations)
      .where(and(
        eq(campaignParticipations.campaignId, campaignId),
        eq(campaignParticipations.influencerId, req.user.id)
      ))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already participating in this campaign' });
    }

    // Get campaign details
    const campaign = await db.select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign.length) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Generate promotional code
    const promoCode = generatePromoCode(campaign[0].id, req.user.id);

    const participation = await db.insert(campaignParticipations)
      .values({
        campaignId,
        influencerId: req.user.id,
        tenantId: req.user.tenantId,
        status: 'active',
        promotionalLinks: [],
        promotionalCodes: [promoCode],
        joinedAt: new Date()
      } as typeof campaignParticipations.$inferInsert)
      .returning();

    // Get user details for response
    const user = await db.select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    res.json({
      ...participation[0],
      influencerName: `${user[0].firstName} ${user[0].lastName}`
    });
  } catch (error) {
    console.error('Error joining campaign:', error);
    res.status(500).json({ error: 'Failed to join campaign' });
  }
};

// Register routes with auth middleware
router.get('/', auth, getAllCampaigns as RequestHandler);
router.post('/', auth, createCampaign as RequestHandler);
router.get('/:id/metrics', auth, getCampaignMetrics as RequestHandler);
router.get('/participations', auth, getCampaignParticipations as RequestHandler);
router.post('/:id/join', auth, joinCampaign as RequestHandler);

export default router; 