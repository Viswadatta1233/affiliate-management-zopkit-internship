import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { affiliateProductCommissions } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';

const payoutRequestSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  paymentMethod: z.enum(['bank_transfer', 'paypal', 'stripe']),
  accountDetails: z.record(z.string(), z.string())
});

export default async function paymentRoutes(fastify: FastifyInstance) {
  // Get affiliate earnings
  fastify.get('/earnings', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const earnings = await db.select({
        totalEarnings: sql<number>`sum(final_commission)`,
        pendingPayouts: sql<number>`sum(case when status = 'pending' then final_commission else 0 end)`,
        paidAmount: sql<number>`sum(case when status = 'paid' then final_commission else 0 end)`
      })
      .from(affiliateProductCommissions)
      .where(and(
        eq(affiliateProductCommissions.tenantId, request.user.tenantId),
        eq(affiliateProductCommissions.affiliateId, request.user.userId)
      ));

      return reply.send(earnings[0] || {
        totalEarnings: 0,
        pendingPayouts: 0,
        paidAmount: 0
      });
    } catch (error) {
      fastify.log.error('Error fetching earnings:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch earnings',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get payout history
  fastify.get('/history', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const payouts = await db.select({
        id: affiliateProductCommissions.id,
        amount: affiliateProductCommissions.finalCommission,
        status: sql<string>`'completed'`,
        createdAt: affiliateProductCommissions.createdAt
      })
      .from(affiliateProductCommissions)
      .where(and(
        eq(affiliateProductCommissions.tenantId, request.user.tenantId),
        eq(affiliateProductCommissions.affiliateId, request.user.userId)
      ))
      .orderBy(affiliateProductCommissions.createdAt);

      return reply.send(payouts);
    } catch (error) {
      fastify.log.error('Error fetching payout history:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch payout history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Request payout
  fastify.post('/request', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const result = payoutRequestSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({ 
          error: 'Validation error',
          details: result.error.format()
        });
      }

      // For now, just acknowledge the payout request
      // In a real implementation, you would:
      // 1. Verify available balance
      // 2. Create a payout record
      // 3. Initiate the actual payout through payment provider
      return reply.status(201).send({
        id: Math.random().toString(36).substr(2, 9),
        ...result.data,
        status: 'pending',
        createdAt: new Date()
      });
    } catch (error) {
      fastify.log.error('Error requesting payout:', error);
      return reply.status(500).send({ 
        error: 'Failed to request payout',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get payment settings
  fastify.get('/settings', async (request, reply) => {
    try {
      if (!request.user?.tenantId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Return default payment settings
      // In a real implementation, these would be stored in the database
      return reply.send({
        minimumPayout: 50,
        paymentMethods: [
          {
            id: 'bank_transfer',
            name: 'Bank Transfer',
            fields: ['bank_name', 'account_number', 'routing_number'],
            fees: '1%',
            processingTime: '2-3 business days'
          },
          {
            id: 'paypal',
            name: 'PayPal',
            fields: ['paypal_email'],
            fees: '2.9% + $0.30',
            processingTime: 'Instant'
          },
          {
            id: 'stripe',
            name: 'Stripe',
            fields: ['card_number', 'expiry', 'cvc'],
            fees: '2.9% + $0.30',
            processingTime: '2-3 business days'
          }
        ],
        payoutSchedule: 'monthly',
        payoutDay: 1,
        currency: 'USD'
      });
    } catch (error) {
      fastify.log.error('Error fetching payment settings:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch payment settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}