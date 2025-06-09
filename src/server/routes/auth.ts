import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users, tenants, roles, influencers } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { UserJwtPayload } from '../security';
import rateLimit from '@fastify/rate-limit';

// Rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutes

const checkBruteForce = (ip: string): boolean => {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (!attempts) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return false;
  }

  // Reset if window has expired
  if (now - attempts.firstAttempt > LOGIN_WINDOW) {
    loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return false;
  }

  // Increment attempts
  attempts.count++;
  loginAttempts.set(ip, attempts);

  // Check if exceeded max attempts
  return attempts.count > MAX_LOGIN_ATTEMPTS;
};

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

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

const confirmResetSchema = z.object({
  token: z.string(),
  password: z.string().min(8).refine(password => {
    return /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  }, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
  }),
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
  // Add rate limiting
  await server.register(rateLimit, {
    max: 100, // Max 100 requests
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'] // Allow localhost
  });

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

      console.log('GET /me - Found user:', {
        id: user?.id,
        email: user?.email,
        role: user?.role,
        tenant: user?.tenant
      });

      if (!user) {
        console.log('GET /me - User not found in database');
        return reply.code(404).send({ error: 'User not found' });
      }

      // Get influencer status if user is an influencer
      let influencerStatus = null;
      if (user.role?.roleName === 'influencer' || user.role?.roleName === 'potential_influencer') {
        const influencer = await db.query.influencers.findFirst({
          where: eq(influencers.userId, user.id)
        });
        influencerStatus = influencer?.status;
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
          role: user.role?.roleName,
          tenantId: user.tenantId,
          influencerStatus
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
    console.log('Registration attempt:', request.body);
    
    try {
      // Validate request body
      const body = registerSchema.parse(request.body);
      
      // Check if user with same email exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, body.email),
      });

      if (existingUser) {
        console.log('Registration failed: Email already exists:', body.email);
        return reply.code(400).send({ error: 'Email already registered' });
      }

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
        countryCode: 'US', // Default country code
        timezone: 'UTC', // Default timezone
        language: 'en', // Default language
      }).returning();

      console.log('User created:', { id: user.id, email: user.email });

      // Generate JWT
      const token = jwt.sign(
        { 
          userId: user.id,
          tenantId: user.tenantId,
          email: user.email,
          role: {
            id: role.id,
            roleName: role.roleName
          }
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
        return reply.code(400).send({ 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  server.post('/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply) => {
    const ip = request.ip;
    
    // Check for brute force attempts
    if (checkBruteForce(ip)) {
      console.log('Login blocked: Too many attempts from IP:', ip);
      return reply.code(429).send({ 
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil((LOGIN_WINDOW - (Date.now() - loginAttempts.get(ip)!.firstAttempt)) / 1000)
      });
    }

    console.log('Login attempt:', { 
      email: request.body.email, 
      tenant: request.body.tenant,
      body: request.body 
    });
    
    try {
      const body = loginSchema.parse(request.body);
      console.log('Validated request body:', body);

      // Special handling for super admin credentials
      if (body.email === 'zopkit@gmail.com' && body.password === 'zopkit123') {
        console.log('Super admin login detected');
        const token = jwt.sign(
          { 
            userId: 'super-admin',
            tenantId: 'super-admin',
            email: body.email,
            role: {
              id: 'super-admin',
              roleName: 'super-admin'
            }
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: body.remember ? '30d' : '24h' }
        );

        return { 
          token, 
          user: {
            id: 'super-admin',
            email: body.email,
            firstName: 'Super',
            lastName: 'Admin',
            isAffiliate: false,
          },
          tenant: {
            id: 'super-admin',
            name: 'Super Admin',
            domain: 'super-admin',
            subdomain: 'super-admin',
            status: 'active'
          },
          role: {
            id: 'super-admin',
            roleName: 'super-admin'
          }
        };
      }
      
      let tenantId: string | undefined;
      
      // If tenant is specified, find tenant first
      if (body.tenant) {
        console.log('Looking up tenant:', body.tenant);
        const tenant = await db.select()
          .from(tenants)
          .where(eq(tenants.subdomain, body.tenant))
          .limit(1);

        if (!tenant.length) {
          console.log('Login failed: Tenant not found:', body.tenant);
          return reply.code(401).send({ error: 'Invalid tenant' });
        }
        tenantId = tenant[0].id;
        console.log('Found tenant:', tenant[0].id);
      }

      // Find user first
      console.log('Looking up user:', body.email);
      const userResult = await db.select()
        .from(users)
        .leftJoin(roles, eq(users.roleId, roles.id))
        .where(eq(users.email, body.email))
        .limit(1);

      if (!userResult.length) {
        console.log('Login failed: User not found:', body.email);
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const user = userResult[0].users;
      const role = Array.isArray(userResult[0].roles) ? userResult[0].roles[0] : userResult[0].roles;

      console.log('Found user with role:', { user, role });

      // If tenant was specified, verify user belongs to that tenant
      if (tenantId && user.tenantId !== tenantId) {
        console.log('Login failed: User does not belong to tenant. User tenant:', user.tenantId, 'Requested tenant:', tenantId);
        return reply.code(401).send({ error: 'Invalid tenant' });
      }

      // Get tenant details
      const tenantResult = await db.select()
        .from(tenants)
        .where(eq(tenants.id, user.tenantId))
        .limit(1);

      if (!tenantResult.length) {
        console.log('Login failed: Tenant not found for user:', user.id);
        return reply.code(401).send({ error: 'Invalid tenant' });
      }

      const tenant = tenantResult[0];

      // Verify password
      console.log('Verifying password for user:', user.email);
      const validPassword = await bcrypt.compare(body.password, user.password);
      if (!validPassword) {
        console.log('Login failed: Invalid password for user:', user.email);
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate JWT with role information
      console.log('Generating JWT for user:', user.email, 'with role:', role);
      const token = jwt.sign(
        { 
          userId: user.id,
          tenantId: user.tenantId,
          email: user.email,
          role: role ? {
            id: role.id,
            roleName: role.roleName
          } : undefined
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
          isAffiliate: user.isAffiliate,
        },
        tenant,
        role: role ? {
          id: role.id,
          roleName: role.roleName
        } : undefined
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

  // Request password reset
  server.post('/reset-password', async (request: FastifyRequest<{ Body: { email: string } }>, reply) => {
    try {
      const { email } = resetPasswordSchema.parse(request.body);
      
      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        // Don't reveal if user exists
        return reply.code(200).send({ message: 'If an account exists with this email, you will receive password reset instructions.' });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, purpose: 'password-reset' },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      // Store reset token in database
      await db.update(users)
        .set({ resetToken, resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000) })
        .where(eq(users.id, user.id));

      // Send reset email
      // TODO: Implement email sending
      console.log('Password reset requested for:', email, 'Token:', resetToken);

      return reply.code(200).send({ message: 'If an account exists with this email, you will receive password reset instructions.' });
    } catch (error) {
      console.error('Password reset error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Confirm password reset
  server.post('/reset-password/confirm', async (request: FastifyRequest<{ Body: { token: string; password: string } }>, reply) => {
    try {
      const { token, password } = confirmResetSchema.parse(request.body);

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; purpose: string };
      
      if (decoded.purpose !== 'password-reset') {
        return reply.code(400).send({ error: 'Invalid reset token' });
      }

      // Find user with valid reset token
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
      });

      if (!user || !user.resetToken || user.resetToken !== token || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
        return reply.code(400).send({ error: 'Invalid or expired reset token' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update password and clear reset token
      await db.update(users)
        .set({ 
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiresAt: null
        })
        .where(eq(users.id, user.id));

      return reply.code(200).send({ message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return reply.code(400).send({ error: 'Invalid reset token' });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
};