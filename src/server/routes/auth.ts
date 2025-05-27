import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users, tenants, roles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { UserJwtPayload } from '../security';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  companyName: z.string().min(2),
  domain: z.string().min(2),
  subdomain: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  tenant: z.string().optional(),
  remember: z.boolean().optional()
});

type RegisterBody = z.infer<typeof registerSchema>;
type LoginBody = z.infer<typeof loginSchema>;

// Extend FastifyRequest to include user property
declare module 'fastify' {
  interface FastifyRequest {
    user?: UserJwtPayload;
  }
}

export const authRoutes = async (server: FastifyInstance) => {
  // Get current user data
  server.get('/me', async (request: FastifyRequest, reply) => {
    try {
      console.log('GET /me - Request user:', request.user);
      
      if (!request.user) {
        console.log('GET /me - No user in request');
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, request.user.userId),
        with: {
          tenant: true,
          role: true,
        },
      });

      console.log('GET /me - Found user:', user);

      if (!user) {
        console.log('GET /me - User not found in database');
        return reply.code(404).send({ error: 'User not found' });
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          countryCode: user.countryCode,
          timezone: user.timezone,
          language: user.language,
          isAffiliate: user.isAffiliate,
        },
        tenant: user.tenant,
        role: user.role,
      };
    } catch (error) {
      console.error('Error in GET /me:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  server.post('/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply) => {
    console.log('Registration attempt:', { email: request.body.email, companyName: request.body.companyName });
    
    try {
      const body = registerSchema.parse(request.body);
      
      // Check if tenant with same domain or subdomain exists
      const existingTenant = await db.query.tenants.findFirst({
        where: eq(tenants.domain, body.domain),
      });

      if (existingTenant) {
        console.log('Registration failed: Domain already exists:', body.domain);
        return reply.code(400).send({ error: 'Domain already registered' });
      }

      // Create tenant
      const [tenant] = await db.insert(tenants).values({
        tenantName: body.companyName,
        domain: body.domain,
        subdomain: body.subdomain,
        status: 'trial',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      }).returning();

      console.log('Tenant created:', { id: tenant.id, name: tenant.tenantName });

      // Create admin role for tenant
      const [role] = await db.insert(roles).values({
        tenantId: tenant.id,
        roleName: 'Tenant Admin',
        description: 'Admin role with full access',
        permissions: ['manage_users', 'manage_affiliates', 'view_reports'],
        isCustom: false,
      }).returning();

      console.log('Admin role created:', { id: role.id, tenantId: role.tenantId });

      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 10);

      // Create user
      const [user] = await db.insert(users).values({
        tenantId: tenant.id,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        password: hashedPassword,
        roleId: role.id,
        termsAccepted: true,
      }).returning();

      console.log('User created:', { id: user.id, email: user.email });

      // Generate JWT
      const token = jwt.sign(
        { 
          userId: user.id,
          tenantId: user.tenantId,
          email: user.email,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      // Get the complete user data with relations
      const completeUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        with: {
          tenant: true,
          role: true,
        },
      });

      if (!completeUser) {
        throw new Error('Failed to fetch complete user data');
      }

      console.log('Registration successful for:', user.email);
      return { 
        token, 
        user: {
          id: completeUser.id,
          email: completeUser.email,
          firstName: completeUser.firstName,
          lastName: completeUser.lastName,
          phone: completeUser.phone,
          countryCode: completeUser.countryCode,
          timezone: completeUser.timezone,
          language: completeUser.language,
          isAffiliate: completeUser.isAffiliate,
        },
        tenant: completeUser.tenant,
        role: completeUser.role,
      };
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  server.post('/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply) => {
    console.log('Login attempt:', { 
      email: request.body.email, 
      tenant: request.body.tenant,
      body: request.body 
    });
    
    try {
      const body = loginSchema.parse(request.body);
      console.log('Validated request body:', body);
      
      let tenantId: string | undefined;
      
      // If tenant is specified, find tenant first
      if (body.tenant) {
        console.log('Looking up tenant:', body.tenant);
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.subdomain, body.tenant),
        });

        if (!tenant) {
          console.log('Login failed: Tenant not found:', body.tenant);
          return reply.code(401).send({ error: 'Invalid tenant' });
        }
        tenantId = tenant.id;
        console.log('Found tenant:', tenant.id);
      }

      // Find user with tenant and role
      console.log('Looking up user:', body.email);
      const userQuery = db.query.users.findFirst({
        where: eq(users.email, body.email),
        with: {
          tenant: true,
          role: true,
        },
      });

      const user = await userQuery;
      console.log('User lookup result:', user ? 'Found' : 'Not found');

      if (!user) {
        console.log('Login failed: User not found:', body.email);
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // If tenant was specified, verify user belongs to that tenant
      if (tenantId && user.tenantId !== tenantId) {
        console.log('Login failed: User does not belong to tenant. User tenant:', user.tenantId, 'Requested tenant:', tenantId);
        return reply.code(401).send({ error: 'Invalid tenant' });
      }

      // Verify password
      console.log('Verifying password for user:', user.email);
      const validPassword = await bcrypt.compare(body.password, user.password);
      if (!validPassword) {
        console.log('Login failed: Invalid password for user:', body.email);
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate JWT
      console.log('Generating JWT for user:', user.email);
      const token = jwt.sign(
        { 
          userId: user.id,
          tenantId: user.tenantId,
          email: user.email,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: body.remember ? '30d' : '24h' }
      );

      console.log('Login successful for:', user.email);
      return { 
        token, 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          countryCode: user.countryCode,
          timezone: user.timezone,
          language: user.language,
          isAffiliate: user.isAffiliate,
        },
        tenant: user.tenant,
        role: user.role,
      };
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return reply.code(400).send({ error: error.errors });
      }
      console.error('Internal server error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
};