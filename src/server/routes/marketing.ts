// import { FastifyInstance } from 'fastify';
// import { z } from 'zod';
// import { db } from '../db';
// import { marketingResources, marketingCampaigns, influencers } from '../db/schema';
// import { eq, and, like, sql } from 'drizzle-orm';

// export const marketingRoutes = async (server: FastifyInstance) => {
//   // Get marketing resources
//   server.get('/resources', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const category = request.query.category as string;
    
//     return db.query.marketingResources.findMany({
//       where: and(
//         eq(marketingResources.tenantId, tenantId),
//         category && eq(marketingResources.category, category)
//       )
//     });
//   });

//   // Create marketing resource
//   server.post('/resources', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const body = request.body as any;
    
//     const result = await db.insert(marketingResources)
//       .values({
//         ...body,
//         tenantId
//       })
//       .returning();
    
//     return result[0];
//   });

//   // Search influencers
//   server.get('/influencers/search', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const {
//       query,
//       category,
//       platform,
//       minFollowers,
//       maxFollowers,
//       minEngagementRate
//     } = request.query as any;
    
//     return db.query.influencers.findMany({
//       where: and(
//         eq(influencers.tenantId, tenantId),
//         query && like(influencers.name, `%${query}%`),
//         category && eq(influencers.category, category),
//         platform && sql`${platform} = any(platforms)`,
//         minFollowers && sql`followers >= ${minFollowers}`,
//         maxFollowers && sql`followers <= ${maxFollowers}`,
//         minEngagementRate && sql`engagement_rate >= ${minEngagementRate}`
//       ),
//       orderBy: [
//         { followers: 'desc' }
//       ]
//     });
//   });

//   // Get knowledge base articles
//   server.get('/knowledge-base', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const category = request.query.category as string;
    
//     return db.query.knowledgeBase.findMany({
//       where: and(
//         eq(knowledgeBase.tenantId, tenantId),
//         category && eq(knowledgeBase.category, category)
//       ),
//       orderBy: [
//         { createdAt: 'desc' }
//       ]
//     });
//   });
// }