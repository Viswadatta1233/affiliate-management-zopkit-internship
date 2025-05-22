// import { FastifyInstance } from 'fastify';
// import { z } from 'zod';
// import { db } from '../db';
// import { payouts, paymentMethods } from '../db/schema';
// import { eq, and } from 'drizzle-orm';

// const payoutSchema = z.object({
//   affiliateId: z.string().uuid(),
//   amount: z.number().positive(),
//   currency: z.string().length(3),
//   paymentMethodId: z.string().uuid()
// });

// export const paymentRoutes = async (server: FastifyInstance) => {
//   // Get payment methods
//   server.get('/methods', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     return db.query.paymentMethods.findMany({
//       where: and(
//         eq(paymentMethods.tenantId, tenantId),
//         eq(paymentMethods.status, 'active')
//       )
//     });
//   });

//   // Create payment method
//   server.post('/methods', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const body = request.body as any;
    
//     const result = await db.insert(paymentMethods)
//       .values({
//         ...body,
//         tenantId,
//         status: 'active'
//       })
//       .returning();
    
//     return result[0];
//   });

//   // Get payouts
//   server.get('/payouts', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const affiliateId = request.headers['x-affiliate-id'] as string;
    
//     return db.query.payouts.findMany({
//       where: and(
//         eq(payouts.tenantId, tenantId),
//         eq(payouts.affiliateId, affiliateId)
//       ),
//       orderBy: [{ createdAt: 'desc' }],
//       with: {
//         paymentMethod: true
//       }
//     });
//   });

//   // Create payout request
//   server.post('/payouts', async (request) => {
//     const body = payoutSchema.parse(request.body);
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const userId = request.user.id;
    
//     const result = await db.insert(payouts)
//       .values({
//         ...body,
//         tenantId,
//         status: 'pending',
//         initiatedBy: userId
//       })
//       .returning();
    
//     return result[0];
//   });

//   // Get payout by ID
//   server.get('/payouts/:id', async (request) => {
//     const { id } = request.params as { id: string };
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     return db.query.payouts.findFirst({
//       where: and(
//         eq(payouts.id, id),
//         eq(payouts.tenantId, tenantId)
//       ),
//       with: {
//         paymentMethod: true,
//         affiliate: true
//       }
//     });
//   });

//   // Update payout status
//   server.post('/payouts/:id/status', async (request) => {
//     const { id } = request.params as { id: string };
//     const { status } = request.body as { status: string };
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     const result = await db.update(payouts)
//       .set({
//         status,
//         completedAt: status === 'completed' ? new Date() : null
//       })
//       .where(and(
//         eq(payouts.id, id),
//         eq(payouts.tenantId, tenantId)
//       ))
//       .returning();
    
//     return result[0];
//   });
// };