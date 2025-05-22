// import { FastifyInstance } from 'fastify';
// import { z } from 'zod';
// import { db } from '../db';
// import { sales, affiliates, trackingLinks } from '../db/schema';
// import { eq, and, sql } from 'drizzle-orm';

// export const analyticsRoutes = async (server: FastifyInstance) => {
//   // Get dashboard metrics
//   server.get('/dashboard', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const timeframe = request.query.timeframe || '30d';
    
//     const metrics = await db.transaction(async (tx) => {
//       const [
//         totalSales,
//         totalCommissions,
//         activeAffiliates,
//         conversionRate
//       ] = await Promise.all([
//         // Total sales
//         tx.select({
//           total: sql<number>`sum(sale_amount)`
//         }).from(sales)
//           .where(and(
//             eq(sales.tenantId, tenantId),
//             sql`created_at >= now() - interval '${timeframe}'`
//           )),
        
//         // Total commissions
//         tx.select({
//           total: sql<number>`sum(commission_amount)`
//         }).from(sales)
//           .where(and(
//             eq(sales.tenantId, tenantId),
//             sql`created_at >= now() - interval '${timeframe}'`
//           )),
        
//         // Active affiliates
//         tx.select({
//           count: sql<number>`count(distinct affiliate_id)`
//         }).from(sales)
//           .where(and(
//             eq(sales.tenantId, tenantId),
//             sql`created_at >= now() - interval '${timeframe}'`
//           )),
        
//         // Conversion rate
//         tx.select({
//           clicks: sql<number>`sum(click_count)`,
//           conversions: sql<number>`sum(conversion_count)`
//         }).from(trackingLinks)
//           .where(and(
//             eq(trackingLinks.tenantId, tenantId),
//             sql`created_at >= now() - interval '${timeframe}'`
//           ))
//       ]);

//       return {
//         totalSales: totalSales[0].total || 0,
//         totalCommissions: totalCommissions[0].total || 0,
//         activeAffiliates: activeAffiliates[0].count || 0,
//         conversionRate: conversionRate[0].clicks 
//           ? (conversionRate[0].conversions / conversionRate[0].clicks) * 100 
//           : 0
//       };
//     });

//     return metrics;
//   });

//   // Get sales chart data
//   server.get('/charts/sales', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const timeframe = request.query.timeframe || '30d';
//     const interval = request.query.interval || 'day';
    
//     const data = await db.select({
//       date: sql`date_trunc(${interval}, created_at)`,
//       sales: sql<number>`sum(sale_amount)`,
//       commissions: sql<number>`sum(commission_amount)`
//     })
//     .from(sales)
//     .where(and(
//       eq(sales.tenantId, tenantId),
//       sql`created_at >= now() - interval '${timeframe}'`
//     ))
//     .groupBy(sql`date_trunc(${interval}, created_at)`)
//     .orderBy(sql`date_trunc(${interval}, created_at)`);

//     return data;
//   });

//   // Get top affiliates
//   server.get('/top-affiliates', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const timeframe = request.query.timeframe || '30d';
//     const limit = Number(request.query.limit) || 5;
    
//     const topAffiliates = await db.select({
//       affiliateId: sales.affiliateId,
//       totalSales: sql<number>`sum(sale_amount)`,
//       totalCommissions: sql<number>`sum(commission_amount)`,
//       conversionCount: sql<number>`count(*)`
//     })
//     .from(sales)
//     .where(and(
//       eq(sales.tenantId, tenantId),
//       sql`created_at >= now() - interval '${timeframe}'`
//     ))
//     .groupBy(sales.affiliateId)
//     .orderBy(sql`sum(sale_amount) desc`)
//     .limit(limit);

//     return topAffiliates;
//   });

//   // Generate custom report
//   server.post('/reports', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const { 
//       startDate,
//       endDate,
//       metrics,
//       groupBy,
//       filters
//     } = request.body as any;
    
//     // Build dynamic query based on requested metrics and filters
//     const query = db.select({
//       // Add selected metrics
//       ...(metrics.includes('sales') && {
//         sales: sql<number>`sum(sale_amount)`
//       }),
//       ...(metrics.includes('commissions') && {
//         commissions: sql<number>`sum(commission_amount)`
//       }),
//       ...(metrics.includes('conversions') && {
//         conversions: sql<number>`count(*)`
//       })
//     })
//     .from(sales)
//     .where(and(
//       eq(sales.tenantId, tenantId),
//       sql`created_at between ${startDate} and ${endDate}`,
//       // Add additional filters
//       ...Object.entries(filters).map(([key, value]) => 
//         eq(sales[key], value)
//       )
//     ))
//     .groupBy(groupBy);

//     const results = await query;
//     return results;
//   });
// };