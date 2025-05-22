// import { FastifyInstance } from 'fastify';
// import { z } from 'zod';
// import { db } from '../db';
// import { campaigns, campaignParticipations } from '../db/schema';
// import { eq, and } from 'drizzle-orm';

// const campaignSchema = z.object({
//   name: z.string(),
//   description: z.string(),
//   startDate: z.string().datetime(),
//   endDate: z.string().datetime().optional(),
//   type: z.enum(['product', 'service', 'event']),
//   requirements: z.object({
//     minFollowers: z.number().optional(),
//     platforms: z.array(z.string()).optional(),
//     categories: z.array(z.string()).optional()
//   }).optional(),
//   rewards: z.object({
//     commissionRate: z.number(),
//     bonusThreshold: z.number().optional(),
//     bonusAmount: z.number().optional()
//   }),
//   content: z.object({
//     images: z.array(z.string()),
//     videos: z.array(z.string()),
//     description: z.string(),
//     guidelines: z.string(),
//     promotionalCodes: z.array(z.string())
//   })
// });

// export const campaignRoutes = async (server: FastifyInstance) => {
//   // Get all campaigns
//   server.get('/', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     return db.query.campaigns.findMany({
//       where: eq(campaigns.tenantId, tenantId),
//       orderBy: campaigns.createdAt,
//       with: {
//         participations: true
//       }
//     });
//   });

//   // Get campaign details
//   server.get('/:id', async (request) => {
//     const { id } = request.params as { id: string };
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     return db.query.campaigns.findFirst({
//       where: and(
//         eq(campaigns.id, id),
//         eq(campaigns.tenantId, tenantId)
//       ),
//       with: {
//         participations: {
//           with: {
//             affiliate: true
//           }
//         }
//       }
//     });
//   });

//   // Create campaign
//   server.post('/', async (request) => {
//     const body = campaignSchema.parse(request.body);
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     const result = await db.insert(campaigns)
//       .values({
//         ...body,
//         tenantId,
//         status: 'draft'
//       })
//       .returning();
    
//     return result[0];
//   });

//   // Update campaign
//   server.put('/:id', async (request) => {
//     const { id } = request.params as { id: string };
//     const body = campaignSchema.partial().parse(request.body);
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     const result = await db.update(campaigns)
//       .set(body)
//       .where(and(
//         eq(campaigns.id, id),
//         eq(campaigns.tenantId, tenantId)
//       ))
//       .returning();
    
//     return result[0];
//   });

//   // Opt-in to campaign
//   server.post('/:id/opt-in', async (request) => {
//     const { id } = request.params as { id: string };
//     const affiliateId = request.headers['x-affiliate-id'] as string;
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     const campaign = await db.query.campaigns.findFirst({
//       where: and(
//         eq(campaigns.id, id),
//         eq(campaigns.tenantId, tenantId),
//         eq(campaigns.status, 'active')
//       )
//     });

//     if (!campaign) {
//       throw new Error('Campaign not found or not active');
//     }

//     const participation = await db.insert(campaignParticipations)
//       .values({
//         campaignId: id,
//         affiliateId,
//         status: 'pending',
//         metrics: {},
//         promotionalLinks: [],
//         promotionalCodes: []
//       })
//       .returning();
    
//     return participation[0];
//   });

//   // Get campaign metrics
//   server.get('/:id/metrics', async (request) => {
//     const { id } = request.params as { id: string };
//     const affiliateId = request.headers['x-affiliate-id'] as string;
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     const participation = await db.query.campaignParticipations.findFirst({
//       where: and(
//         eq(campaignParticipations.campaignId, id),
//         eq(campaignParticipations.affiliateId, affiliateId)
//       ),
//       with: {
//         campaign: true
//       }
//     });
    
//     if (!participation) {
//       throw new Error('Campaign participation not found');
//     }
    
//     return participation.metrics;
//   });

//   // Update campaign status
//   server.post('/:id/status', async (request) => {
//     const { id } = request.params as { id: string };
//     const { status } = request.body as { status: string };
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     const result = await db.update(campaigns)
//       .set({ status })
//       .where(and(
//         eq(campaigns.id, id),
//         eq(campaigns.tenantId, tenantId)
//       ))
//       .returning();
    
//     return result[0];
//   });
// };