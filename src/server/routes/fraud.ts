import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { eq, and, sql } from 'drizzle-orm';
import { trackingLinks, trackingEvents } from '../db/schema';

const fraudRuleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['ip_based', 'click_pattern', 'conversion_pattern', 'time_based']),
  condition: z.string(),
  threshold: z.number(),
  action: z.enum(['flag', 'block', 'notify']),
  status: z.enum(['active', 'inactive']).default('active')
});

export default async function fraudRoutes(fastify: FastifyInstance) {
  // Get fraud detection rules
  fastify.get('/rules', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // For now, return some default rules since we don't have a fraud_rules table yet
      const defaultRules = [
        {
          id: '1',
          name: 'Rapid Clicks',
          description: 'Detect rapid clicking patterns from same IP',
          type: 'click_pattern',
          condition: 'clicks_per_minute > 30',
          threshold: 30,
          action: 'flag',
          status: 'active'
        },
        {
          id: '2',
          name: 'Multiple IPs',
          description: 'Detect access from too many different IPs',
          type: 'ip_based',
          condition: 'unique_ips_per_hour > 10',
          threshold: 10,
          action: 'notify',
          status: 'active'
        }
      ];

      return reply.send(defaultRules);
    } catch (error) {
      fastify.log.error('Error fetching fraud rules:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch fraud rules',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create fraud detection rule
  fastify.post('/rules', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const result = fraudRuleSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ 
          error: 'Validation error',
          details: result.error.format()
        });
      }

      // For now, just acknowledge the rule creation since we don't have a fraud_rules table
      return reply.status(201).send({
        id: Math.random().toString(36).substr(2, 9),
        ...result.data,
        createdAt: new Date()
      });
    } catch (error) {
      fastify.log.error('Error creating fraud rule:', error);
      return reply.status(500).send({ 
        error: 'Failed to create fraud rule',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get suspicious activities
  fastify.get('/suspicious-activities', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Query tracking events to find suspicious patterns
      const events = await db.select({
        id: trackingEvents.id,
        type: trackingEvents.type,
        affiliateId: trackingEvents.affiliateId,
        createdAt: trackingEvents.createdAt,
        metadata: trackingEvents.metadata
      })
      .from(trackingEvents)
      .where(and(
        eq(trackingEvents.tenantId, request.user.tenantId),
        sql`created_at >= now() - interval '24 hours'`
      ))
      .orderBy(trackingEvents.createdAt);

      // Simple pattern detection (this would be more sophisticated in production)
      const suspiciousActivities = events.reduce((acc, event) => {
        const key = `${event.affiliateId}-${event.type}`;
        if (!acc[key]) {
          acc[key] = {
            affiliateId: event.affiliateId,
            eventType: event.type,
            count: 0,
            lastEventTime: null
          };
        }
        
        acc[key].count++;
        
        // Check for rapid succession events
        if (acc[key].lastEventTime) {
          const timeDiff = new Date(event.createdAt).getTime() - new Date(acc[key].lastEventTime).getTime();
          if (timeDiff < 1000) { // Less than 1 second apart
            acc[key].suspicious = true;
          }
        }
        
        acc[key].lastEventTime = event.createdAt;
        return acc;
      }, {} as Record<string, any>);

      return reply.send(Object.values(suspiciousActivities)
        .filter(activity => activity.suspicious));
    } catch (error) {
      fastify.log.error('Error fetching suspicious activities:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch suspicious activities',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}