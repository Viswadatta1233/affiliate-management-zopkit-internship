import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { trackingLinks, trackingEvents } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const trackingEventSchema = z.object({
  type: z.enum(['click', 'conversion', 'sale']),
  trackingCode: z.string(),
  metadata: z.record(z.any()).optional(),
});

export const trackingRoutes: FastifyPluginAsync = async (fastify) => {
  // Record tracking event
  fastify.post('/event', async (request, reply) => {
    try {
      const result = trackingEventSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ 
          error: 'Validation error',
          details: result.error.format()
        });
      }

      const { type, trackingCode, metadata } = result.data;

      // Find tracking link
      const link = await db.query.trackingLinks.findFirst({
        where: eq(trackingLinks.trackingCode, trackingCode),
      });

      if (!link) {
        return reply.status(404).send({ error: 'Invalid tracking code' });
      }

      // Record event
      const [event] = await db.insert(trackingEvents).values({
        type,
        trackingLinkId: link.id,
        tenantId: link.tenantId,
        affiliateId: link.affiliateId,
        metadata: metadata || {},
        createdAt: new Date(),
      }).returning();

      // Update tracking link metrics
      if (type === 'click') {
        await db.update(trackingLinks)
          .set({ totalClicks: link.totalClicks + 1 })
          .where(eq(trackingLinks.id, link.id));
      } else if (type === 'conversion') {
        await db.update(trackingLinks)
          .set({ totalConversions: link.totalConversions + 1 })
          .where(eq(trackingLinks.id, link.id));
      }

      return event;
    } catch (error) {
      fastify.log.error('Error recording tracking event:', error);
      return reply.status(500).send({ 
        error: 'Failed to record tracking event',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get tracking link metrics
  fastify.get('/metrics/:trackingCode', async (request, reply) => {
    try {
      const { trackingCode } = request.params as { trackingCode: string };

      const link = await db.query.trackingLinks.findFirst({
        where: eq(trackingLinks.trackingCode, trackingCode),
      });

      if (!link) {
        return reply.status(404).send({ error: 'Invalid tracking code' });
      }

      // Get events for this tracking link
      const events = await db.query.trackingEvents.findMany({
        where: eq(trackingEvents.trackingLinkId, link.id),
      });

      return {
        trackingCode: link.trackingCode,
        totalClicks: link.totalClicks,
        totalConversions: link.totalConversions,
        totalSales: link.totalSales,
        events: events.map(e => ({
          type: e.type,
          createdAt: e.createdAt,
          metadata: e.metadata
        }))
      };
    } catch (error) {
      fastify.log.error('Error fetching tracking metrics:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch tracking metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get affiliate tracking links
  fastify.get('/links', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const links = await db.query.trackingLinks.findMany({
        where: eq(trackingLinks.affiliateId, request.user.userId),
      });

      return links;
    } catch (error) {
      fastify.log.error('Error fetching tracking links:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch tracking links',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}; 