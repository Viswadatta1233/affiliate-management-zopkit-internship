import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth';
import affiliateRoutes from './affiliates';
import { trackingRoutes } from './tracking';
import paymentRoutes from './payments';
import campaignRoutes from './campaigns';
import { commissionRoutes } from './commissions';
import productRoutes from './products';
import communicationRoutes from './communications';
import analyticsRoutes from './analytics';
import { marketingRoutes } from './marketing';
import fraudRoutes from './fraud';
import { influencerRoutes } from './influencers';

export const configureRoutes = async (server: FastifyInstance) => {
  // Register route handlers
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(affiliateRoutes, { prefix: '/api/affiliates' });
  await server.register(trackingRoutes, { prefix: '/api/tracking' });
  await server.register(paymentRoutes, { prefix: '/api/payments' });
  await server.register(campaignRoutes, { prefix: '/api/campaigns' });
  await server.register(commissionRoutes, { prefix: '/api/commissions' });
  await server.register(productRoutes, { prefix: '/api/products' });
  await server.register(communicationRoutes, { prefix: '/api/communications' });
  await server.register(analyticsRoutes, { prefix: '/api/analytics' });
  await server.register(marketingRoutes, { prefix: '/api/marketing' });
  await server.register(fraudRoutes, { prefix: '/api/fraud' });
  await server.register(influencerRoutes, { prefix: '/api/influencer' });
};