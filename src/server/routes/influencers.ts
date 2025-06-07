import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { users, influencers, roles, tenants } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Define the validation schema
const influencerRegistrationSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  niche: z.string().min(2, 'Niche must be at least 2 characters'),
  country: z.string().min(2, 'Country must be at least 2 characters'),
  bio: z.string().optional(),
  agreedToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
  instagram: z.string().url('Invalid Instagram URL').optional(),
  youtube: z.string().url('Invalid YouTube URL').optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type InfluencerRegistrationBody = z.infer<typeof influencerRegistrationSchema>;

export async function influencerRoutes(server: FastifyInstance) {
  // Register influencer
  server.post('/register', async (request: FastifyRequest<{ Body: InfluencerRegistrationBody }>, reply) => {
    try {
      console.log('Influencer registration attempt:', request.body);
      
      // Validate request body
      const body = influencerRegistrationSchema.parse(request.body);
      console.log('Validated registration data:', body);

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, body.email),
      });

      if (existingUser) {
        console.log('Registration failed: Email already exists:', body.email);
        return reply.code(400).send({ error: 'Email already registered' });
      }

      // Get or create default tenant
      let defaultTenant = await db.query.tenants.findFirst({
        where: eq(tenants.tenantName, 'Default Tenant'),
      });

      if (!defaultTenant) {
        [defaultTenant] = await db.insert(tenants).values({
          tenantName: 'Default Tenant',
          domain: 'localhost',
          subdomain: 'default',
          status: 'active',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        }).returning();
        console.log('Created default tenant:', defaultTenant.id);
      }

      // Get or create influencer role for the tenant
      let influencerRole = await db.query.roles.findFirst({
        where: eq(roles.roleName, 'potential_influencer'),
      });

      if (!influencerRole) {
        [influencerRole] = await db.insert(roles).values({
          roleName: 'potential_influencer',
          description: 'Default role for potential influencers',
          permissions: [
            'view_profile',
            'edit_profile',
            'view_campaigns',
            'apply_campaigns',
            'view_earnings',
            'view_analytics'
          ],
          isCustom: false,
          tenantId: defaultTenant.id,
        }).returning();
        console.log('Created influencer role:', influencerRole.id);
      }

      // Hash password using bcryptjs
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(body.password, salt);
      console.log('Password hashed successfully');

      // Split full name into first and last name
      const nameParts = body.fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create user
      const [user] = await db.insert(users).values({
        email: body.email,
        firstName: firstName,
        lastName: lastName,
        password: hashedPassword,
        phone: body.phone,
        roleId: influencerRole.id,
        termsAccepted: body.agreedToTerms,
        tenantId: defaultTenant.id,
        countryCode: 'IN', // Default country code
        timezone: 'Asia/Kolkata', // Default timezone
        language: 'en', // Default language
      }).returning();

      console.log('Created influencer user:', user.id);

      // Create influencer profile with social media links
      const [influencer] = await db.insert(influencers).values({
          userId: user.id,
        niche: body.niche,
        country: body.country,
        bio: body.bio || '',
          status: 'pending',
        socialMedia: {
          instagram: body.instagram || '',
          youtube: body.youtube || '',
        },
          metrics: {
            followers: 0,
            engagement: 0,
            reach: 0,
            total_campaigns: 0,
            total_earnings: 0,
          },
        }).returning();

      return {
        success: true,
        message: 'Influencer registered successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAffiliate: user.isAffiliate,
          tenantId: user.tenantId,
        },
        influencer: {
          id: influencer.id,
          niche: influencer.niche,
          country: influencer.country,
          status: influencer.status,
        }
      };
    } catch (error) {
      console.error('Error in influencer registration:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      // Log the full error for debugging
      console.error('Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      return reply.code(500).send({ error: 'Error creating user', details: error.message });
    }
  });

  // Get influencer profile
  server.get('/profile/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const influencer = await db.query.influencers.findFirst({
        where: eq(influencers.userId, id),
        with: {
          user: true,
        },
      });

      if (!influencer) {
        return reply.status(404).send({
          error: 'Influencer not found',
        });
      }

      return reply.send(influencer);
    } catch (error) {
      server.log.error({
        msg: 'Error fetching influencer profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // Get all influencers (super admin only)
  server.get('/', async (request: FastifyRequest, reply) => {
    try {
      // Check if user is super admin
      if (request.user?.email !== 'zopkit@gmail.com') {
        return reply.code(403).send({ error: 'Unauthorized' });
      }

      const allInfluencers = await db.query.influencers.findMany({
        with: {
          user: true
        },
        orderBy: (influencers, { desc }) => [desc(influencers.createdAt)]
      });

      return allInfluencers.map(influencer => ({
        id: influencer.id,
        userId: influencer.userId,
        email: influencer.user.email,
        firstName: influencer.user.firstName,
        lastName: influencer.user.lastName,
        niche: influencer.niche,
        country: influencer.country,
        bio: influencer.bio,
        socialMedia: influencer.socialMedia,
        status: influencer.status,
        metrics: influencer.metrics,
        createdAt: influencer.createdAt
      }));
    } catch (error) {
      console.error('Error fetching influencers:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get all pending potential influencers (super admin only)
  server.get('/pending', async (request: FastifyRequest, reply) => {
    try {
      // Check if user is super admin
      if (request.user?.email !== 'zopkit@gmail.com') {
        return reply.code(403).send({ error: 'Unauthorized' });
      }

      const pendingInfluencers = await db.query.influencers.findMany({
        where: eq(influencers.status, 'pending'),
        with: {
          user: true
        },
        orderBy: (influencers, { desc }) => [desc(influencers.createdAt)]
      });

      return pendingInfluencers.map(influencer => ({
        id: influencer.id,
        userId: influencer.userId,
        email: influencer.user.email,
        firstName: influencer.user.firstName,
        lastName: influencer.user.lastName,
        niche: influencer.niche,
        country: influencer.country,
        bio: influencer.bio,
        socialMedia: influencer.socialMedia,
        status: influencer.status,
        createdAt: influencer.createdAt
      }));
    } catch (error) {
      console.error('Error fetching pending influencers:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update influencer status (super admin only)
  server.patch('/:id/status', async (request: FastifyRequest<{
    Params: { id: string },
    Body: { status: 'pending' | 'approved' | 'rejected' | 'suspended' }
  }>, reply) => {
    try {
      // Check if user is super admin
      if (request.user?.email !== 'zopkit@gmail.com') {
        return reply.code(403).send({ error: 'Unauthorized' });
      }

      const { id } = request.params;
      const { status } = request.body;

      // Get the influencer
      const influencer = await db.query.influencers.findFirst({
        where: eq(influencers.id, id),
        with: {
          user: true
        }
      });

      if (!influencer) {
        return reply.code(404).send({ error: 'Influencer not found' });
      }

      // If approving, update role to influencer
      if (status === 'approved') {
        // Get or create influencer role
        let influencerRole = await db.query.roles.findFirst({
          where: eq(roles.roleName, 'influencer')
        });

        if (!influencerRole) {
          [influencerRole] = await db.insert(roles).values({
            roleName: 'influencer',
            description: 'Approved influencer role',
            permissions: [
              'view_profile',
              'edit_profile',
              'view_campaigns',
              'apply_campaigns',
              'join_campaigns',
              'view_earnings',
              'view_analytics'
            ],
            isCustom: false,
            tenantId: influencer.user.tenantId
          }).returning();
        }

        // Update user's role
        await db.update(users)
          .set({ roleId: influencerRole.id })
          .where(eq(users.id, influencer.userId));
      }

      // Update influencer status
      const [updatedInfluencer] = await db.update(influencers)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(influencers.id, id))
        .returning();

      return {
        success: true,
        influencer: updatedInfluencer
      };
    } catch (error) {
      console.error('Error updating influencer status:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
} 