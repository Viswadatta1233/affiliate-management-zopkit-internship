import Fastify from 'fastify';
import { configureSecurity } from './security';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import cors from '@fastify/cors';
import { initializeDatabase } from './db';
import dotenv from 'dotenv';
import { configureRoutes } from './routes';
import { authMiddleware } from './middleware/auth';

// Load environment variables
dotenv.config();

const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Create Fastify instance
    const server = Fastify({
      logger: {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      },
      trustProxy: true,
      ajv: {
        customOptions: {
          removeAdditional: 'all',
          coerceTypes: true,
          useDefaults: true,
        },
      },
    });

    // Configure CORS first
    await server.register(cors, {
      origin: true, // Allow all origins in development
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
      exposedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      preflight: true,
      preflightContinue: false,
    });

    // Add request logging
    server.addHook('onRequest', (request, reply, done) => {
      server.log.debug({
        msg: 'Incoming request',
        method: request.method,
        url: request.url,
        headers: request.headers,
      });
      done();
    });

    // Configure security
    await configureSecurity(server);

    // Register multipart plugin for handling form data
    await server.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1 // Maximum number of files
      }
    });

    // Add auth middleware before routes
    server.addHook('preHandler', async (request, reply) => {
      server.log.debug({
        msg: 'Auth middleware',
        url: request.url,
        headers: request.headers,
      });
      return authMiddleware(request, reply);
    });

    // Configure routes
    await configureRoutes(server);

    // Add rate limiting
    await server.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute'
    });

    // Start server
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    await server.listen({ port, host });
    console.log(`Server is running on http://localhost:${port}`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();