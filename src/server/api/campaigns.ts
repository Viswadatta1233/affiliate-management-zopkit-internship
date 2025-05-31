import { Router, Response, RequestHandler } from 'express';
import { z } from 'zod';
import { auth, AuthenticatedRequest, AuthenticatedRequestHandler } from '@/lib/auth';
import { db } from '../db';
import { campaigns, campaignParticipations, affiliates } from '../../../drizzle/schema';
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
  const participations = await db.select()
    .from(campaignParticipations)
    .where(eq(campaignParticipations.affiliateId, req.user.id));
  res.json(participations);
};

const optInToCampaign: AuthenticatedRequestHandler = async (req, res) => {
  const campaignId = req.params.id;

  // Check if already participating
  const existing = await db.select()
    .from(campaignParticipations)
    .where(and(
      eq(campaignParticipations.campaignId, campaignId),
      eq(campaignParticipations.affiliateId, req.user.id)
    ))
    .limit(1);

  if (existing.length > 0) {
    return res.status(400).json({ error: 'Already participating in this campaign' });
  }

  // Get campaign details to check requirements
  const campaign = await db.select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign.length) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  // Get affiliate details
  const affiliate = await db.select()
    .from(affiliates)
    .where(eq(affiliates.id, req.user.id))
    .limit(1);

  if (!affiliate.length) {
    return res.status(404).json({ error: 'Affiliate not found' });
  }

  // Generate promo code
  const promoCode = generatePromoCode(campaign[0].name, req.user.id);

  const participation = await db.insert(campaignParticipations)
    .values({
      campaignId,
      affiliateId: req.user.id,
      tenantId: req.user.tenantId,
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

  res.json(participation[0]);
};

// Register routes with auth middleware
router.get('/', auth, getAllCampaigns as RequestHandler);
router.post('/', auth, createCampaign as RequestHandler);
router.get('/:id/metrics', auth, getCampaignMetrics as RequestHandler);
router.get('/participations', auth, getCampaignParticipations as RequestHandler);
router.post('/:id/opt-in', auth, optInToCampaign as RequestHandler);

export default router; 