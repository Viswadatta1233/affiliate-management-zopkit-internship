import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { trackingLinks, trackingEvents } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

export default async function analyticsRoutes(fastify: FastifyInstance) {
  // Get dashboard metrics
  fastify.get('/', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const timeframe = '30d'; // Default to last 30 days
      
      const metrics = await db.transaction(async (tx) => {
        const [
          totalClicks,
          totalConversions,
          activeAffiliates,
          conversionRate
        ] = await Promise.all([
          // Total clicks
          tx.select({
            total: sql<number>`sum(total_clicks)`
          })
          .from(trackingLinks)
          .where(and(
            eq(trackingLinks.tenantId, request.user!.tenantId),
            sql`created_at >= now() - interval '${timeframe}'`
          )),
          
          // Total conversions
          tx.select({
            total: sql<number>`sum(total_conversions)`
          })
          .from(trackingLinks)
          .where(and(
            eq(trackingLinks.tenantId, request.user!.tenantId),
            sql`created_at >= now() - interval '${timeframe}'`
          )),
          
          // Active affiliates
          tx.select({
            count: sql<number>`count(distinct affiliate_id)`
          })
          .from(trackingLinks)
          .where(and(
            eq(trackingLinks.tenantId, request.user!.tenantId),
            sql`created_at >= now() - interval '${timeframe}'`
          )),
          
          // Conversion rate
          tx.select({
            clicks: sql<number>`sum(total_clicks)`,
            conversions: sql<number>`sum(total_conversions)`
          })
          .from(trackingLinks)
          .where(and(
            eq(trackingLinks.tenantId, request.user!.tenantId),
            sql`created_at >= now() - interval '${timeframe}'`
          ))
        ]);

        return {
          totalClicks: totalClicks[0]?.total || 0,
          totalConversions: totalConversions[0]?.total || 0,
          activeAffiliates: activeAffiliates[0]?.count || 0,
          conversionRate: totalClicks[0]?.total 
            ? (totalConversions[0]?.total / totalClicks[0]?.total) * 100 
            : 0
        };
      });

      return reply.send(metrics);
    } catch (error) {
      fastify.log.error('Error fetching analytics:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get events timeline
  fastify.get('/events', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const events = await db.select({
        id: trackingEvents.id,
        type: trackingEvents.type,
        createdAt: trackingEvents.createdAt,
        metadata: trackingEvents.metadata
      })
      .from(trackingEvents)
      .where(eq(trackingEvents.tenantId, request.user.tenantId))
      .orderBy(trackingEvents.createdAt);

      return reply.send(events);
    } catch (error) {
      fastify.log.error('Error fetching events:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch events',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get top performing tracking links
  fastify.get('/top-links', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const limit = 5; // Default to top 5
      
      const topLinks = await db.select({
        id: trackingLinks.id,
        trackingCode: trackingLinks.trackingCode,
        totalClicks: trackingLinks.totalClicks,
        totalConversions: trackingLinks.totalConversions,
        conversionRate: sql<number>`(total_conversions::float / NULLIF(total_clicks, 0)) * 100`
      })
      .from(trackingLinks)
      .where(eq(trackingLinks.tenantId, request.user.tenantId))
      .orderBy(sql`total_conversions desc`)
      .limit(limit);

      return reply.send(topLinks);
    } catch (error) {
      fastify.log.error('Error fetching top links:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch top links',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}