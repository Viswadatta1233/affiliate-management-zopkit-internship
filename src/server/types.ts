import '@fastify/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId: string;
      tenantId: string;
      email: string;
    };
  }
} 