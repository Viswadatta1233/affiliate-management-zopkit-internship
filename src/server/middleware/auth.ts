import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

// List of public routes that don't require authentication
const publicRoutes = [
  '/api/influencer/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/influencer/registration',
  '/influencer/register',
  '/register/influencer',
  '/api/affiliates/accept'
];

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { url, method } = request;

  // Log the request details
  console.log('Auth Middleware:', {
    url,
    method,
    headers: request.headers,
  });

  // Allow public routes without any auth check
  if (publicRoutes.some(route => url.startsWith(route))) {
    console.log('Skipping authentication for public route:', url);
    return; // Skip auth check for public routes
  }

  // For protected routes, check for authentication token
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    console.log('No auth header found for protected route');
    return reply.status(401).send({
      error: 'Authentication required',
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    // Add the user to the request headers
    request.headers['x-user-id'] = decoded.userId;
    request.headers['x-tenant-id'] = decoded.tenantId;

    // Special handling for super admin
    if (decoded.email === 'zopkit@gmail.com') {
      request.headers['x-super-admin'] = 'true';
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    return reply.status(401).send({
      error: 'Invalid token',
    });
  }
}

export const config = {
  matcher: '/api/:path*',
}; 