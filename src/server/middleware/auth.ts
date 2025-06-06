import { FastifyRequest, FastifyReply } from 'fastify';

// List of public routes that don't require authentication
const publicRoutes = [
  '/api/influencer/register',
  '/api/auth/login',
  '/api/auth/register',
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
    console.log('Public route accessed:', url);
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

  // Add the user to the request headers
  request.headers['x-user-id'] = authHeader.split(' ')[1];
}

export const config = {
  matcher: '/api/:path*',
}; 