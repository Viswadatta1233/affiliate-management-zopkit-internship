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
  };
}

export type { UserJwtPayload };

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
                  id: user.role.id
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
            decoded = jwt.verify(newToken, JWT_SECRET) as UserJwtPayload;
          } catch (refreshError) {
            console.log('Refresh token verification failed:', refreshError);
            return reply.code(401).send({ error: 'Invalid refresh token' });
          }
        } else {
          console.log('Token verification failed:', error);
          return reply.code(401).send({ error: 'Invalid token' });
        }
      }

      // Attach user info to request
      request.user = decoded;
      request.tenantId = decoded.tenantId;

      console.log('Successfully authenticated user:', decoded.email, 'with role:', decoded.role);
    } catch (error) {
      console.error('Authentication error:', error);
      return reply.code(401).send({ error: 'Authentication failed' });
    }
  });
};

// Helper function to check if user is authenticated
export const isAuthenticated = (request: FastifyRequest): boolean => {
  return !!request.user;
};

// Helper function to get current user
export const getCurrentUser = (request: FastifyRequest): UserJwtPayload | undefined => {
  return request.user;
};

// Helper function to enforce authentication
export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!isAuthenticated(request)) {
    return reply.code(401).send({ error: 'Authentication required' });
  }
};

// Helper function to enforce tenant isolation
export const enforceTenantIsolation = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user?.tenantId) {
    return reply.code(401).send({ error: 'Tenant ID required' });
  }
};