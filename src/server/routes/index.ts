import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth';
import affiliateRoutes from './affiliates';
// import { trackingRoutes } from './tracking';
// import { paymentRoutes } from './payments';
// import { campaignRoutes } from './campaigns';
import { commissionRoutes } from './commissions';
import productRoutes  from './products';
// import { communicationRoutes } from './communications';
// import { analyticsRoutes } from './analytics';
import { marketingRoutes } from './marketing';
// import { fraudRoutes } from './fraud';

export const configureRoutes = (server: FastifyInstance) => {
  // Register route handlers
  server.register(authRoutes, { prefix: '/api/auth' });
  server.register(affiliateRoutes, { prefix: '/api/affiliates' });
  // server.register(trackingRoutes, { prefix: '/api/tracking' });
  // server.register(paymentRoutes, { prefix: '/api/payments' });
  // server.register(campaignRoutes, { prefix: '/api/campaigns' });
  server.register(commissionRoutes, { prefix: '/api/commissions' });
  server.register(productRoutes, { prefix: '/api/products' });
  // server.register(communicationRoutes, { prefix: '/api/communications' });
  // server.register(analyticsRoutes, { prefix: '/api/analytics' });
  server.register(marketingRoutes, { prefix: '/api/marketing' });
  // server.register(fraudRoutes, { prefix: '/api/fraud' });
};