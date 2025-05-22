// import { FastifyInstance } from 'fastify';
// import { z } from 'zod';
// import { db } from '../db';
// import { commissionTiers, commissionDistributions, productCommissions } from '../db/schema';
// import { eq, and } from 'drizzle-orm';

// const tierSchema = z.object({
//   name: z.string(),
//   level: z.number().int().min(1),
//   baseCommissionRate: z.number().min(0).max(100),
//   rolloverRate: z.number().min(0).max(100),
//   minMonthlySales: z.number().min(0),
//   minActiveReferrals: z.number().int().min(0),
//   bonusThreshold: z.number().optional(),
//   bonusAmount: z.number().optional(),
//   recurringCommission: z.boolean(),
//   recurringDuration: z.number().int().min(0).max(36),
//   effectiveDate: z.date(),
//   expiryDate: z.date().optional()
// });

// const productCommissionSchema = z.object({
//   productId: z.string(),
//   productName: z.string(),
//   categoryId: z.string().optional(),
//   commissionType: z.enum(['percentage', 'fixed']),
//   commissionValue: z.number().min(0),
//   tierOverrides: z.record(z.string(), z.number()),
//   startDate: z.date(),
//   endDate: z.date().optional(),
//   minQuantity: z.number().int().min(1),
//   maxQuantity: z.number().int().optional()
// });

// export const commissionRoutes = async (server: FastifyInstance) => {
//   // Get commission tiers
//   server.get('/tiers', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     return db.query.commissionTiers.findMany({
//       where: eq(commissionTiers.tenantId, tenantId),
//       orderBy: [{ level: 'asc' }]
//     });
//   });

//   // Create commission tier
//   server.post('/tiers', async (request) => {
//     const body = tierSchema.parse(request.body);
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     const result = await db.insert(commissionTiers)
//       .values({
//         ...body,
//         tenantId,
//         status: 'active'
//       })
//       .returning();
    
//     return result[0];
//   });

//   // Update commission tier
//   server.put('/tiers/:id', async (request) => {
//     const { id } = request.params as { id: string };
//     const body = tierSchema.partial().parse(request.body);
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     const result = await db.update(commissionTiers)
//       .set(body)
//       .where(and(
//         eq(commissionTiers.id, id),
//         eq(commissionTiers.tenantId, tenantId)
//       ))
//       .returning();
    
//     return result[0];
//   });

//   // Get product commissions
//   server.get('/products', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     return db.query.productCommissions.findMany({
//       where: eq(productCommissions.tenantId, tenantId)
//     });
//   });

//   // Create product commission
//   server.post('/products', async (request) => {
//     const body = productCommissionSchema.parse(request.body);
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     const result = await db.insert(productCommissions)
//       .values({
//         ...body,
//         tenantId,
//         status: 'active'
//       })
//       .returning();
    
//     return result[0];
//   });

//   // Get commission distributions
//   server.get('/distributions', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const affiliateId = request.headers['x-affiliate-id'] as string;
    
//     return db.query.commissionDistributions.findMany({
//       where: and(
//         eq(commissionDistributions.tenantId, tenantId),
//         eq(commissionDistributions.beneficiaryId, affiliateId)
//       ),
//       with: {
//         sale: true
//       },
//       orderBy: [{ createdAt: 'desc' }]
//     });
//   });
// };