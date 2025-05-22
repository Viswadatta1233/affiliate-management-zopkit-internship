// import { FastifyInstance } from 'fastify';
// import { z } from 'zod';
// import { db } from '../db';
// import { fraudRules, fraudAlerts } from '../db/schema';
// import { eq, and } from 'drizzle-orm';

// export const fraudRoutes = async (server: FastifyInstance) => {
//   // Get fraud rules
//   server.get('/rules', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     return db.query.fraudRules.findMany({
//       where: eq(fraudRules.tenantId, tenantId)
//     });
//   });

//   // Create fraud rule
//   server.post('/rules', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const body = request.body as any;
    
//     const result = await db.insert(fraudRules)
//       .values({
//         ...body,
//         tenantId,
//         status: 'active'
//       })
//       .returning();
    
//     return result[0];
//   });

//   // Get fraud alerts
//   server.get('/alerts', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const status = request.query.status as string;
    
//     return db.query.fraudAlerts.findMany({
//       where: and(
//         eq(fraudAlerts.tenantId, tenantId),
//         status && eq(fraudAlerts.status, status)
//       ),
//       orderBy: [
//         { createdAt: 'desc' }
//       ],
//       with: {
//         rule: true
//       }
//     });
//   });

//   // Update alert status
//   server.post('/alerts/:id/status', async (request) => {
//     const { id } = request.params as { id: string };
//     const { status } = request.body as { status: string };
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     const result = await db.update(fraudAlerts)
//       .set({ status })
//       .where(and(
//         eq(fraudAlerts.id, id),
//         eq(fraudAlerts.tenantId, tenantId)
//       ))
//       .returning();
    
//     return result[0];
//   });

//   // Get risk score
//   server.get('/risk-score', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const affiliateId = request.query.affiliateId as string;
    
//     // Calculate risk score based on various factors
//     const metrics = await db.transaction(async (tx) => {
//       const [
//         alertCount,
//         failedLogins,
//         suspiciousIPs,
//         highValueTransactions
//       ] = await Promise.all([
//         // Number of fraud alerts
//         tx.select({
//           count: sql<number>`count(*)`
//         }).from(fraudAlerts)
//           .where(and(
//             eq(fraudAlerts.tenantId, tenantId),
//             eq(fraudAlerts.affiliateId, affiliateId),
//             sql`created_at >= now() - interval '30d'`
//           )),
        
//         // Failed login attempts
//         tx.select({
//           count: sql<number>`count(*)`
//         }).from(loginAttempts)
//           .where(and(
//             eq(loginAttempts.tenantId, tenantId),
//             eq(loginAttempts.userId, affiliateId),
//             eq(loginAttempts.success, false),
//             sql`created_at >= now() - interval '24h'`
//           )),
        
//         // Suspicious IP addresses
//         tx.select({
//           count: sql<number>`count(distinct ip_address)`
//         }).from(loginAttempts)
//           .where(and(
//             eq(loginAttempts.tenantId, tenantId),
//             eq(loginAttempts.userId, affiliateId),
//             sql`created_at >= now() - interval '24h'`
//           )),
        
//         // High value transactions
//         tx.select({
//           count: sql<number>`count(*)`
//         }).from(sales)
//           .where(and(
//             eq(sales.tenantId, tenantId),
//             eq(sales.affiliateId, affiliateId),
//             sql`sale_amount > 1000`,
//             sql`created_at >= now() - interval '24h'`
//           ))
//       ]);

//       // Calculate risk score (0-100)
//       const riskScore = Math.min(
//         100,
//         (alertCount[0].count * 20) +
//         (failedLogins[0].count * 10) +
//         (suspiciousIPs[0].count > 3 ? 30 : 0) +
//         (highValueTransactions[0].count * 5)
//       );

//       return {
//         score: riskScore,
//         factors: {
//           alerts: alertCount[0].count,
//           failedLogins: failedLogins[0].count,
//           suspiciousIPs: suspiciousIPs[0].count,
//           highValueTransactions: highValueTransactions[0].count
//         }
//       };
//     });

//     return metrics;
//   });
// };