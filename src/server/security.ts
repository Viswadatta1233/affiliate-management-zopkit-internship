import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import helmet from '@fastify/helmet';

// Extend FastifyRequest to include 'user'
declare module 'fastify' {
  interface FastifyRequest {
    user?: UserJwtPayload;
    tenantId?: string;
  }
}

// Define permission mappings for routes
const routePermissions = {
  '/api/products': ['products:view', 'products:manage'],
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

// Routes that skip CSRF check
const CSRF_EXEMPT_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/me',
  '/api/affiliates/accept',
];

interface UserJwtPayload extends JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
  role?: {
    id: string;
    permissions: string[];
  };
}

export type { UserJwtPayload };

// Helper to check if user has required permission
const hasPermission = (userPermissions: readonly string[], requiredPermission: string | string[]): boolean => {
  const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
  return userPermissions.some(p => p === '*' || permissions.includes(p));
};

export const configureSecurity = async (server: FastifyInstance) => {
  // Ensure required environment variables
  const JWT_SECRET = process.env.JWT_SECRET;
  const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

  if (!JWT_SECRET || !REFRESH_TOKEN_SECRET) {
    throw new Error('JWT_SECRET and REFRESH_TOKEN_SECRET must be set in environment variables');
  }

  // Add security headers
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  });

  // Add CORS headers via hook
  server.addHook('onRequest', async (request, reply) => {
    const origin = process.env.NODE_ENV === 'development'
      ? request.headers.origin || 'http://localhost:5173'
      : (process.env.ALLOWED_ORIGINS || '').split(',').find(o => o === request.headers.origin);

    if (origin) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Access-Control-Allow-Headers', [
        'Content-Type',
        'Authorization',
        'x-csrf-token',
        'x-session-token',
        'x-refresh-token',
        'x-tenant-id'
      ].join(', '));
      reply.header('Access-Control-Expose-Headers', 'x-new-token');

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return reply.send();
      }
    }
  });

  // Add CSRF protection
  server.addHook('onRequest', async (request, reply) => {
    // Skip CSRF check for development or exempt routes
    if (process.env.NODE_ENV === 'development' || CSRF_EXEMPT_ROUTES.includes(request.url)) {
      return;
    }

    const csrfToken = request.headers['x-csrf-token'];
    const sessionToken = request.headers['x-session-token'];

    if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
      return reply.code(403).send({ error: 'Invalid CSRF token' });
    }
  });

  // JWT authentication with refresh token support
  server.addHook('onRequest', async (request, reply) => {
    // Skip authentication for public routes
    if (PUBLIC_ROUTES.includes(request.url) || PUBLIC_PATHS.some(path => request.url.startsWith(path))) {
      console.log('Skipping authentication for public route:', request.url);
      return;
    }

    try {
      const authHeader = request.headers.authorization;
      console.log('Auth header:', authHeader);
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Invalid authorization header');
        return reply.code(401).send({ error: 'Invalid authorization header' });
      }

      const token = authHeader.split(' ')[1];
      let decoded: UserJwtPayload;

      try {
        decoded = jwt.verify(token, JWT_SECRET) as UserJwtPayload;
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          // Handle token refresh
          const refreshToken = request.headers['x-refresh-token'];
          if (!refreshToken) {
            console.log('No refresh token provided for expired token');
            return reply.code(401).send({ error: 'Token expired' });
          }

          try {
            const refreshDecoded = jwt.verify(refreshToken as string, REFRESH_TOKEN_SECRET) as UserJwtPayload;
            
            // Verify user and generate new token
            const user = await db.query.users.findFirst({
              where: eq(users.id, refreshDecoded.userId),
              with: { role: true }
            });

            if (!user || user.tenantId !== refreshDecoded.tenantId) {
              return reply.code(401).send({ error: 'Invalid refresh token' });
            }

            const newToken = jwt.sign(
              { 
                userId: user.id,
                tenantId: user.tenantId,
                email: user.email,
                role: user.role ? {
                  id: user.role.id,
                  permissions: user.role.permissions as string[]
                } : undefined
              },
              JWT_SECRET,
              { expiresIn: '24h' }
            );

            // Generate new refresh token
            const newRefreshToken = jwt.sign(
              { userId: user.id, tenantId: user.tenantId },
              REFRESH_TOKEN_SECRET,
              { expiresIn: '7d' }
            );

            reply.header('x-new-token', newToken);
            reply.header('x-new-refresh-token', newRefreshToken);
            decoded = jwt.decode(newToken) as UserJwtPayload;
          } catch (refreshError) {
            console.error('Refresh token verification error:', refreshError);
            return reply.code(401).send({ error: 'Invalid refresh token' });
          }
        } else {
          return reply.code(401).send({ error: 'Invalid token' });
        }
      }

      // Verify user exists and belongs to tenant
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
        with: { role: true }
      });

      if (!user || user.tenantId !== decoded.tenantId) {
        console.log('Invalid user or tenant for user:', decoded.userId, 'expected:', decoded.tenantId, 'actual:', user?.tenantId);
        return reply.code(401).send({ error: 'Invalid user or tenant' });
      }

      // Attach user info to request
      request.user = {
        ...decoded,
        role: user.role ? {
          id: user.role.id,
          permissions: user.role.permissions as string[]
        } : undefined
      };
      console.log('Successfully authenticated user:', decoded.email, 'with role:', request.user.role);
    } catch (error) {
      console.error('Authentication error:', error);
      return reply.code(401).send({ error: 'Authentication failed' });
    }
  });

  // Role-based access control
  server.addHook('onRequest', async (request, reply) => {
    // Skip RBAC for public routes and /api/auth/me
    if (PUBLIC_ROUTES.includes(request.url) || 
        PUBLIC_PATHS.some(path => request.url.startsWith(path)) ||
        request.url === '/api/auth/me') {
      console.log('Skipping RBAC for route:', request.url);
      return;
    }

    const user = request.user;
    console.log('RBAC check for user:', {
      email: user?.email,
      role: user?.role,
      permissions: user?.role?.permissions,
      url: request.url
    });

    if (!user?.role?.permissions) {
      console.log('RBAC failed: No role/permissions assigned for user:', user?.email);
      return reply.code(403).send({ error: 'Access denied - No role assigned' });
    }

    // Find matching route permissions
    const route = (Object.keys(routePermissions) as Array<keyof RoutePermissions>).find(path => request.url.startsWith(path));
    if (route) {
      const requiredPermissions = routePermissions[route];
      console.log('Required permissions for route:', {
        route,
        requiredPermissions,
        userPermissions: user.role.permissions
      });

      if (!hasPermission(user.role.permissions, requiredPermissions)) {
        console.log('RBAC failed: Insufficient permissions for user:', user.email, 'on route:', route);
        return reply.code(403).send({ error: 'Access denied - Insufficient permissions' });
      }
      console.log('RBAC check passed for user:', user.email, 'on route:', route);
    } else {
      console.log('No permission requirements found for route:', request.url);
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