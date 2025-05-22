// import { FastifyInstance } from 'fastify';
// import { z } from 'zod';
// import { db } from '../db';
// import { affiliates } from '../db/schema';
// import { eq, and } from 'drizzle-orm';

// const affiliateSchema = z.object({
//   userId: z.string().uuid(),
//   tenantId: z.string().uuid(),
//   referralCode: z.string(),
//   companyName: z.string().optional(),
//   websiteUrl: z.string().url().optional(),
//   socialMedia: z.record(z.string(), z.any()).optional(),
//   taxId: z.string().optional(),
//   taxFormType: z.string().optional(),
//   paymentThreshold: z.number().min(0),
//   preferredCurrency: z.string().length(3),
//   promotionalMethods: z.array(z.string())
// });

// export const affiliateRoutes = async (server: FastifyInstance) => {
//   // Get all affiliates for a tenant
//   server.get('/', async (request, reply) => {
//     const tenantId = request.headers['x-tenant-id'];
    
//     if (!tenantId) {
//       return reply.code(400).send({ error: 'Tenant ID is required' });
//     }

//     const results = await db.query.affiliates.findMany({
//       where: eq(affiliates.tenantId, tenantId as string),
//       with: {
//         user: true,
//         currentTier: true,
//       },
//     });

//     return results;
//   });

//   // Get affiliate by ID
//   server.get('/:id', async (request, reply) => {
//     const { id } = request.params as { id: string };
//     const tenantId = request.headers['x-tenant-id'];

//     if (!tenantId) {
//       return reply.code(400).send({ error: 'Tenant ID is required' });
//     }

//     const affiliate = await db.query.affiliates.findFirst({
//       where: and(
//         eq(affiliates.id, id),
//         eq(affiliates.tenantId, tenantId as string)
//       ),
//       with: {
//         user: true,
//         currentTier: true,
//         trackingLinks: true,
//         sales: {
//           orderBy: [{ createdAt: 'desc' }],
//           limit: 10
//         },
//         campaignParticipations: {
//           with: {
//             campaign: true
//           }
//         }
//       }
//     });

//     if (!affiliate) {
//       return reply.code(404).send({ error: 'Affiliate not found' });
//     }

//     return affiliate;
//   });

//   // Create new affiliate
//   server.post('/', async (request, reply) => {
//     const body = affiliateSchema.parse(request.body);
    
//     const result = await db.insert(affiliates).values(body).returning();
    
//     return result[0];
//   });

//   // Update affiliate
//   server.put('/:id', async (request, reply) => {
//     const { id } = request.params as { id: string };
//     const body = affiliateSchema.partial().parse(request.body);
//     const tenantId = request.headers['x-tenant-id'];

//     if (!tenantId) {
//       return reply.code(400).send({ error: 'Tenant ID is required' });
//     }

//     const result = await db.update(affiliates)
//       .set(body)
//       .where(and(
//         eq(affiliates.id, id),
//         eq(affiliates.tenantId, tenantId as string)
//       ))
//       .returning();

//     if (!result.length) {
//       return reply.code(404).send({ error: 'Affiliate not found' });
//     }

//     return result[0];
//   });

//   // Approve affiliate
//   server.post('/:id/approve', async (request, reply) => {
//     const { id } = request.params as { id: string };
//     const tenantId = request.headers['x-tenant-id'];
//     const userId = request.user.id;

//     if (!tenantId) {
//       return reply.code(400).send({ error: 'Tenant ID is required' });
//     }

//     const result = await db.update(affiliates)
//       .set({
//         status: 'active',
//         approvedBy: userId,
//         approvedAt: new Date()
//       })
//       .where(and(
//         eq(affiliates.id, id),
//         eq(affiliates.tenantId, tenantId as string),
//         eq(affiliates.status, 'pending')
//       ))
//       .returning();

//     if (!result.length) {
//       return reply.code(404).send({ error: 'Affiliate not found or already approved' });
//     }

//     return result[0];
//   });

//   // Reject affiliate
//   server.post('/:id/reject', async (request, reply) => {
//     const { id } = request.params as { id: string };
//     const tenantId = request.headers['x-tenant-id'];

//     if (!tenantId) {
//       return reply.code(400).send({ error: 'Tenant ID is required' });
//     }

//     const result = await db.update(affiliates)
//       .set({ status: 'rejected' })
//       .where(and(
//         eq(affiliates.id, id),
//         eq(affiliates.tenantId, tenantId as string),
//         eq(affiliates.status, 'pending')
//       ))
//       .returning();

//     if (!result.length) {
//       return reply.code(404).send({ error: 'Affiliate not found or already processed' });
//     }

//     return result[0];
//   });

//   // Get affiliate metrics
//   server.get('/:id/metrics', async (request, reply) => {
//     const { id } = request.params as { id: string };
//     const tenantId = request.headers['x-tenant-id'];

//     if (!tenantId) {
//       return reply.code(400).send({ error: 'Tenant ID is required' });
//     }

//     const metrics = await db.transaction(async (tx) => {
//       const affiliate = await tx.query.affiliates.findFirst({
//         where: and(
//           eq(affiliates.id, id),
//           eq(affiliates.tenantId, tenantId as string)
//         )
//       });

//       if (!affiliate) {
//         throw new Error('Affiliate not found');
//       }

//       const [sales, clicks, conversions] = await Promise.all([
//         tx.select({
//           total: sql<number>`sum(sale_amount)`,
//           count: sql<number>`count(*)`
//         }).from(sales).where(eq(sales.affiliateId, id)),
        
//         tx.select({
//           total: sql<number>`sum(click_count)`
//         }).from(trackingLinks).where(eq(trackingLinks.affiliateId, id)),
        
//         tx.select({
//           total: sql<number>`sum(conversion_count)`
//         }).from(trackingLinks).where(eq(trackingLinks.affiliateId, id))
//       ]);

//       return {
//         totalSales: sales[0].total || 0,
//         salesCount: sales[0].count || 0,
//         totalClicks: clicks[0].total || 0,
//         totalConversions: conversions[0].total || 0,
//         conversionRate: clicks[0].total ? (conversions[0].total / clicks[0].total) * 100 : 0
//       };
//     });

//     return metrics;
//   });
// };