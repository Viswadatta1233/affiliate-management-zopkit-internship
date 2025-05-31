import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';

const templateSchema = z.object({
  name: z.string(),
  type: z.enum(['email', 'sms', 'push']),
  subject: z.string(),
  content: z.string(),
  variables: z.array(z.string()),
  status: z.enum(['draft', 'active', 'inactive'])
});

const notificationSchema = z.object({
  recipientId: z.string().uuid(),
  templateId: z.string().uuid(),
  channel: z.enum(['email', 'sms', 'push']),
  data: z.record(z.string(), z.any()),
  scheduledFor: z.date().optional()
});

export default async function communicationRoutes(fastify: FastifyInstance) {
  // Get notification templates
  fastify.get('/templates', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const templates = await db.query.marketingGuidelines.findMany({
        where: eq(marketingGuidelines.tenantId, request.user.tenantId)
      });

      return reply.send(templates);
    } catch (error) {
      fastify.log.error('Error fetching templates:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create notification template
  fastify.post('/templates', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const result = templateSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ 
          error: 'Validation error',
          details: result.error.format()
        });
      }

      const [template] = await db.insert(marketingGuidelines)
        .values({
          content: JSON.stringify(result.data),
          tenantId: request.user.tenantId,
          updatedAt: new Date()
        })
        .returning();

      return reply.status(201).send(template);
    } catch (error) {
      fastify.log.error('Error creating template:', error);
      return reply.status(500).send({ 
        error: 'Failed to create template',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get marketing guidelines
  fastify.get('/guidelines', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const guidelines = await db.query.marketingGuidelines.findMany({
        where: eq(marketingGuidelines.tenantId, request.user.tenantId)
      });

      return reply.send(guidelines);
    } catch (error) {
      fastify.log.error('Error fetching guidelines:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch guidelines',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update marketing guidelines
  fastify.put('/guidelines/:id', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params as { id: string };
      const { content } = request.body as { content: string };

      const [guideline] = await db.update(marketingGuidelines)
        .set({
          content,
          updatedAt: new Date()
        })
        .where(and(
          eq(marketingGuidelines.id, id),
          eq(marketingGuidelines.tenantId, request.user.tenantId)
        ))
        .returning();

      if (!guideline) {
        return reply.status(404).send({ error: 'Guideline not found' });
      }

      return reply.send(guideline);
    } catch (error) {
      fastify.log.error('Error updating guideline:', error);
      return reply.status(500).send({ 
        error: 'Failed to update guideline',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}