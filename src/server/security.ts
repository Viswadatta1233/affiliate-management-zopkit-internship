import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

// Extend FastifyRequest to include 'user'
declare module 'fastify' {
  interface FastifyRequest {
    user?: UserJwtPayload;
    tenantId?: string;
  }
}

// Define permission mappings for routes
const routePermissions = {
  '/api/affiliates': ['affiliates:view', 'affiliates:manage'],
  '/api/tracking': ['tracking:manage'],
  '/api/campaigns': ['campaigns:view', 'campaigns:manage'],
  '/api/commissions': ['commissions:view', 'commissions:manage'],
  '/api/payments': ['payments:view', 'payments:manage'],
  '/api/analytics': ['analytics:view'],
  '/api/marketing': ['marketing:view', 'marketing:manage'],
  '/api/fraud': ['fraud:view', 'fraud:manage'],
  '/api/communications': ['communications:view', 'communications:manage'],
  '/api/settings': ['settings:manage']
} as const;

type RoutePermissions = typeof routePermissions;

// Skip tenant isolation for these routes
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/affiliates/accept',
];

// Skip tenant isolation for these paths
const PUBLIC_PATHS = [
  '/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/affiliates/accept',
];

interface UserJwtPayload extends JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
}

export type { UserJwtPayload };

// Helper to check if user has required permission
const hasPermission = (userPermissions: readonly string[], requiredPermission: string): boolean => {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('*');
};

export const configureSecurity = (server: FastifyInstance) => {
  // JWT authentication
  server.addHook('onRequest', async (request, reply) => {
    // Skip authentication for public routes
    if (PUBLIC_ROUTES.includes(request.url) || PUBLIC_PATHS.some(path => request.url.startsWith(path))) {
      return;
    }

    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.code(401).send({ error: 'No authorization header' });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return reply.code(401).send({ error: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as UserJwtPayload;

      // Verify user exists and belongs to tenant
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
      });

      if (!user) {
        return reply.code(401).send({ error: 'User not found' });
      }

      if (user.tenantId !== decoded.tenantId) {
        return reply.code(403).send({ error: 'Invalid tenant' });
      }

      // Attach user info to request
      request.user = decoded;
    } catch (error) {
      console.error('Authentication error:', error);
      return reply.code(401).send({ error: 'Invalid token' });
    }
  });

  // Role-based access control
  server.addHook('onRequest', async (request, reply) => {
    // Skip RBAC for public routes
    if (PUBLIC_ROUTES.includes(request.url) || PUBLIC_PATHS.some(path => request.url.startsWith(path))) {
      return;
    }

    const user = request.user;
    if (!user || !user.role) {
      console.log('RBAC failed: No role assigned for user:', user?.email);
      return reply.code(403).send({ error: 'Access denied - No role assigned' });
    }

    // Find matching route permissions
    const route = (Object.keys(routePermissions) as Array<keyof RoutePermissions>).find(path => request.url.startsWith(path));
    if (route) {
      const requiredPermissions = routePermissions[route];
      if (!hasPermission(user.role.permissions, requiredPermissions)) {
        console.log('RBAC failed: Insufficient permissions for user:', user.email, 'on route:', route);
        return reply.code(403).send({ error: 'Access denied - Insufficient permissions' });
      }
    }
  });

  // Tenant isolation - Skip for auth routes
  server.addHook('onRequest', async (request, reply) => {
    // Skip tenant isolation for public routes
    if (PUBLIC_ROUTES.includes(request.url) || PUBLIC_PATHS.some(path => request.url.startsWith(path))) {
      return;
    }

    if (!request.user) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    // Add tenant ID to request for database queries
    request.tenantId = request.user.tenantId;
  });
};

export const authenticateJWT = async (request: FastifyRequest, reply: FastifyReply) => {
  // Skip authentication for public routes
  if (PUBLIC_ROUTES.includes(request.url) || PUBLIC_PATHS.some(path => request.url.startsWith(path))) {
    console.log('Skipping authentication for public route:', request.url);
    return;
  }

  try {
    const authHeader = request.headers.authorization;
    console.log('Auth header:', authHeader);
    
    if (!authHeader) {
      console.log('No authorization header');
      return reply.code(401).send({ error: 'No authorization header' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid authorization header format');
      return reply.code(401).send({ error: 'Invalid authorization header format' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('No token provided');
      return reply.code(401).send({ error: 'No token provided' });
    }

    console.log('Received token:', token);
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    console.log('Using JWT_SECRET for verification:', JWT_SECRET);

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as UserJwtPayload;
      console.log('Successfully decoded JWT:', decoded);
    } catch (err) {
      console.error('JWT verification error:', err);
      if (err instanceof jwt.TokenExpiredError) {
        return reply.code(401).send({ error: 'Token expired' });
      }
      if (err instanceof jwt.JsonWebTokenError) {
        return reply.code(401).send({ error: 'Invalid token' });
      }
      return reply.code(401).send({ error: 'Token verification failed' });
    }

    // Verify user exists and belongs to tenant
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    });

    if (!user) {
      console.log('User not found for userId:', decoded.userId);
      return reply.code(401).send({ error: 'User not found' });
    }

    if (user.tenantId !== decoded.tenantId) {
      console.log('Invalid tenant for user:', user.id, 'expected:', decoded.tenantId, 'actual:', user.tenantId);
      return reply.code(403).send({ error: 'Invalid tenant' });
    }

    // Attach user info to request
    request.user = decoded;
    console.log('User attached to request:', request.user);
  } catch (error) {
    console.error('Authentication error:', error);
    return reply.code(401).send({ error: 'Invalid token' });
  }
};

export const enforceTenantIsolation = async (request: FastifyRequest, reply: FastifyReply) => {
  // Skip tenant isolation for public routes
  if (PUBLIC_ROUTES.includes(request.url) || PUBLIC_PATHS.some(path => request.url.startsWith(path))) {
    return;
  }

  if (!request.user) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  // Add tenant ID to request for database queries
  request.tenantId = request.user.tenantId;
};