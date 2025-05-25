import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users, tenants, roles } from '../db/schema';
import { eq, and } from 'drizzle-orm';
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
  password: z.string().min(8),
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
  // Public test route to check user existence
  server.get('/test-user/:email', {
    config: {
      public: true // Mark this route as public
    }
  }, async (request: FastifyRequest<{ Params: { email: string } }>, reply) => {
    try {
      const email = request.params.email;
      console.log('Testing user existence for:', email);
      
      // First check if the user exists
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
        with: {
          tenant: true,
          role: true,
        },
      });

      if (!user) {
        console.log('Test route: User not found:', email);
        return reply.code(404).send({ 
          exists: false,
          message: 'User not found'
        });
      }

      // Get all tenants for debugging
      const allTenants = await db.query.tenants.findMany();
      console.log('All available tenants:', allTenants.map(t => ({
        id: t.id,
        name: t.tenantName,
        subdomain: t.subdomain
      })));

      console.log('Test route found user:', {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        roleId: user.roleId,
        hasTenant: !!user.tenant,
        hasRole: !!user.role,
        tenantSubdomain: user.tenant?.subdomain,
        roleName: user.role?.roleName,
        passwordHash: user.password
      });

      return {
        exists: true,
        details: {
          id: user.id,
          email: user.email,
          hasTenant: !!user.tenant,
          hasRole: !!user.role,
          tenantSubdomain: user.tenant?.subdomain,
          tenantId: user.tenantId,
          roleId: user.roleId
        }
      };
    } catch (error) {
      console.error('Test route error:', error);
      return reply.code(500).send({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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

  // Test route to create a test user
  server.post('/create-test-user', {
    config: {
      public: true
    }
  }, async (request, reply) => {
    try {
      // Create test tenant if it doesn't exist
      let tenant = await db.query.tenants.findFirst({
        where: eq(tenants.subdomain, 'acme')
      });

      if (!tenant) {
        console.log('Creating test tenant...');
        const [newTenant] = await db.insert(tenants).values({
          tenantName: 'Acme Corporation',
          domain: 'acme.com',
          subdomain: 'acme',
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        }).returning();
        tenant = newTenant;
      }

      // Create test role if it doesn't exist
      let role = await db.query.roles.findFirst({
        where: and(
          eq(roles.tenantId, tenant.id),
          eq(roles.roleName, 'Affiliate')
        )
      });

      if (!role) {
        console.log('Creating test role...');
        const [newRole] = await db.insert(roles).values({
          tenantId: tenant.id,
          roleName: 'Affiliate',
          description: 'Affiliate role with limited access',
          permissions: ['view_dashboard', 'manage_links', 'view_commissions'],
          isCustom: false,
        }).returning();
        role = newRole;
      }

      // Hash the test password
      const hashedPassword = await bcrypt.hash('password123', 10);

      // Create or update test user
      let user = await db.query.users.findFirst({
        where: eq(users.email, 'eskomal66@gmail.com')
      });

      if (user) {
        console.log('Updating existing test user...');
        const [updatedUser] = await db.update(users)
          .set({
            password: hashedPassword,
            tenantId: tenant.id,
            roleId: role.id,
            isAffiliate: true
          })
          .where(eq(users.id, user.id))
          .returning();
        user = updatedUser;
      } else {
        console.log('Creating new test user...');
        const [newUser] = await db.insert(users).values({
          email: 'eskomal66@gmail.com',
          firstName: 'Test',
          lastName: 'User',
          password: hashedPassword,
          tenantId: tenant.id,
          roleId: role.id,
          isAffiliate: true
        }).returning();
        user = newUser;
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          roleId: user.roleId
        },
        tenant: {
          id: tenant.id,
          name: tenant.tenantName,
          subdomain: tenant.subdomain
        },
        role: {
          id: role.id,
          name: role.roleName
        }
      };
    } catch (error) {
      console.error('Error creating test user:', error);
      return reply.code(500).send({
        error: 'Failed to create test user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  server.post('/register', async (request: FastifyRequest<{ Body: RegisterBody }>, reply) => {
    console.log('Registration attempt:', { email: request.body.email, companyName: request.body.companyName });
    console.log('Full registration data:', request.body);
    
    try {
      const body = registerSchema.parse(request.body);
      console.log('Validation passed:', body);
      
      // Check if tenant with same domain or subdomain exists
      const existingTenant = await db.query.tenants.findFirst({
        where: eq(tenants.domain, body.domain),
      });

      if (existingTenant) {
        console.log('Registration failed: Domain already exists:', body.domain);
        return reply.code(400).send({ error: 'Domain already registered' });
      }

      console.log('Creating tenant...');
      // Create tenant
      try {
        const [tenant] = await db.insert(tenants).values({
          tenantName: body.companyName,
          domain: body.domain,
          subdomain: body.subdomain,
          status: 'trial',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        }).returning();

        console.log('Tenant created:', { id: tenant.id, name: tenant.tenantName });

        console.log('Creating admin role...');
        // Create admin role for tenant
        try {
          const [role] = await db.insert(roles).values({
            tenantId: tenant.id,
            roleName: 'Tenant Admin',
            description: 'Admin role with full access',
            permissions: ['manage_users', 'manage_affiliates', 'view_reports'],
            isCustom: false,
          }).returning();

          console.log('Admin role created:', { id: role.id, tenantId: role.tenantId });

          console.log('Hashing password...');
          // Hash password
          const hashedPassword = await bcrypt.hash(body.password, 10);

          console.log('Creating user...');
          // Create user
          try {
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
          } catch (userError) {
            console.error('Error creating user:', userError);
            throw userError;
          }
        } catch (roleError) {
          console.error('Error creating role:', roleError);
          throw roleError;
        }
      } catch (tenantError) {
        console.error('Error creating tenant:', tenantError);
        throw tenantError;
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
    }
  });

  server.post('/login', async (request: FastifyRequest<{ Body: LoginBody }>, reply) => {
    console.log('Login attempt:', { email: request.body.email });
    
    try {
      const body = loginSchema.parse(request.body);
      const tenant = request.query.tenant as string;
      
      console.log('Login details:', { email: body.email, tenant });
      
      // Hash the provided password for comparison
      const hashedPassword = await bcrypt.hash(body.password, 10);
      console.log('Password debug:', {
        providedPassword: body.password,
        hashedPassword
      });
      
      // First verify if the user exists
      const user = await db.query.users.findFirst({
        where: eq(users.email, body.email),
        with: {
          tenant: true,
          role: true,
        },
      });

      console.log('Found user:', user ? { 
        id: user.id, 
        email: user.email, 
        tenantId: user.tenantId,
        roleId: user.roleId,
        hasTenant: !!user.tenant,
        hasRole: !!user.role,
        tenantSubdomain: user.tenant?.subdomain,
        roleName: user.role?.roleName,
        storedPassword: user.password
      } : 'null');

      if (!user) {
        console.log('Login failed: User not found:', body.email);
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Verify password first
      const validPassword = await bcrypt.compare(body.password, user.password);
      console.log('Password verification:', { 
        email: user.email,
        providedPassword: body.password,
        isValid: validPassword
      });

      if (!validPassword) {
        console.log('Login failed: Invalid password for user:', body.email);
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Now handle tenant verification
      if (tenant) {
        console.log('Checking for specific tenant:', tenant);
        
        // First check if the tenant exists
        const tenantRecord = await db.query.tenants.findFirst({
          where: eq(tenants.subdomain, tenant)
        });

        console.log('Found tenant:', tenantRecord ? {
          id: tenantRecord.id,
          name: tenantRecord.tenantName,
          subdomain: tenantRecord.subdomain,
          status: tenantRecord.status
        } : 'null');

        if (!tenantRecord) {
          console.log('Login failed: Tenant not found:', tenant);
          return reply.code(401).send({ error: 'Invalid tenant' });
        }

        // Then check if user belongs to this tenant
        if (user.tenant?.subdomain !== tenant) {
          console.log('Login failed: Tenant mismatch:', { 
            expected: tenant, 
            actual: user.tenant?.subdomain,
            userTenantId: user.tenantId,
            tenantId: tenantRecord.id
          });
          return reply.code(401).send({ error: 'User does not belong to this tenant' });
        }
      }

      // Check if user has required role
      if (!user.role) {
        console.log('Login failed: No role assigned to user:', user.email);
        return reply.code(401).send({ error: 'No role assigned' });
      }

      // Generate JWT
      const token = jwt.sign(
        { 
          userId: user.id,
          tenantId: user.tenantId,
          email: user.email,
          role: user.role.roleName,
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
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
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
};