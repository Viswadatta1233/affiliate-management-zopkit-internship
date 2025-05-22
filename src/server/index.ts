import Fastify from 'fastify';
import cors from '@fastify/cors';
import { authenticateJWT, enforceTenantIsolation } from './security';
import { authRoutes } from './routes/auth';
import { pool } from './db';

// Ensure JWT secret is set
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
console.log('Using JWT_SECRET:', JWT_SECRET);

const server = Fastify({
  logger: true
});

// Register CORS
server.register(cors, {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Register authentication middleware
server.addHook('onRequest', authenticateJWT);
server.addHook('onRequest', enforceTenantIsolation);

// Register routes
server.register(authRoutes, { prefix: '/api/auth' });

// Health check route
server.get('/health', async () => {
  return { status: 'ok' };
});

// Start server
const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Handle cleanup
process.on('SIGINT', async () => {
  try {
    await server.close();
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
});

start();