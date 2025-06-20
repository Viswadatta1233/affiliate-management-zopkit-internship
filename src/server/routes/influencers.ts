import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { users, influencers, roles, tenants, influencerInstaAnalytics, influencerFbAnalytics, influencerTwitterAnalytics } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

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

interface InfluencerWithUser {
  id: string;
  userId: string;
  niche: string;
  country: string;
  bio: string | null;
  socialMedia: {
    instagram?: string;
    youtube?: string;
  };
  status: string;
  metrics: {
    followers: number;
    engagement: number;
    reach: number;
    total_campaigns: number;
    total_earnings: number;
  };
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
  };
}

// Create nodemailer transporter (reuse from affiliates.ts)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dattanidumukkala.98@gmail.com',
    pass: 'pbbmlywqphqiakpz',
  },
});

export async function influencerRoutes(server: FastifyInstance) {
  // Test endpoint to verify route registration
  server.get('/test', async (request, reply) => {
    return { message: 'Influencer routes are working!' };
  });

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

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          role: {
            id: influencerRole.id,
            roleName: influencerRole.roleName
          },
          tenantId: defaultTenant.id
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return {
        success: true,
        message: 'Influencer registered successfully. Your account is pending approval.',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAffiliate: user.isAffiliate,
          tenantId: user.tenantId,
          role: {
            id: influencerRole.id,
            roleName: influencerRole.roleName
          }
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

      return allInfluencers.map(influencer => {
        const user = Array.isArray(influencer.user) ? influencer.user[0] : influencer.user;
        return {
          id: influencer.id,
          userId: influencer.userId,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          niche: influencer.niche,
          country: influencer.country,
          bio: influencer.bio,
          socialMedia: influencer.socialMedia,
          status: influencer.status,
          metrics: influencer.metrics,
          createdAt: influencer.createdAt
        };
      });
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

      return pendingInfluencers.map(influencer => {
        const user = Array.isArray(influencer.user) ? influencer.user[0] : influencer.user;
        return {
          id: influencer.id,
          userId: influencer.userId,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          niche: influencer.niche,
          country: influencer.country,
          bio: influencer.bio,
          socialMedia: influencer.socialMedia,
          status: influencer.status,
          createdAt: influencer.createdAt
        };
      });
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

      const user = Array.isArray(influencer.user) ? influencer.user[0] : influencer.user;

      // If approving, update role to influencer
      let statusChangedToInfluencer = false;
      if (status === 'approved') {
        // Get or create influencer role
        let influencerRole = await db.query.roles.findFirst({
          where: eq(roles.roleName, 'influencer')
        });

        if (!influencerRole) {
          [influencerRole] = await db.insert(roles).values({
            roleName: 'influencer',
            description: 'Approved influencer role',
            isCustom: false,
            tenantId: user?.tenantId
          }).returning();
        }

        // Update user's role
        await db.update(users)
          .set({ roleId: influencerRole.id })
          .where(eq(users.id, influencer.userId));

        // Check if status is changing from 'potential_influencer' to 'influencer'
        if (influencer.status === 'pending' || influencer.status === 'potential_influencer') {
          statusChangedToInfluencer = true;
        }
      }

      // Update influencer status
      const [updatedInfluencer] = await db.update(influencers)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(influencers.id, id))
        .returning();

      // Send approval notification if opted in
      if (statusChangedToInfluencer && influencer.allowNotificationForApproval && user?.email) {
        try {
          await transporter.sendMail({
            from: 'dattanidumukkala.98@gmail.com',
            to: user.email,
            subject: 'You have been approved as an Influencer!',
            html: `<p>Your status has been updated to <b>influencer</b>. You can now access all influencer features on the platform.</p>`
          });
        } catch (err) {
          server.log.error('Error sending influencer approval email:', err);
        }
      }

      return {
        success: true,
        influencer: updatedInfluencer
      };
    } catch (error) {
      console.error('Error updating influencer status:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update influencer profile (authenticated)
  server.patch('/profile', async (request, reply) => {
    try {
      const userId = request.user?.userId;
      if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

      // Validation schema for profile update
      const profileSchema = z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        country: z.string().min(1),
        niche: z.string().min(1),
        bio: z.string().optional(),
        socialMedia: z.object({
          instagram: z.string().url().optional(),
          youtube: z.string().url().optional(),
        }).optional(),
      });
      const body = profileSchema.parse(request.body);

      // Update users table
      await db.update(users)
        .set({
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
        })
        .where(eq(users.id, userId));

      // Update influencers table
      await db.update(influencers)
        .set({
          country: body.country,
          niche: body.niche,
          bio: body.bio,
          socialMedia: body.socialMedia,
        })
        .where(eq(influencers.userId, userId));

      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update influencer password (authenticated)
  server.patch('/password', async (request, reply) => {
    try {
      const userId = request.user?.userId;
      if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

      // Validation schema for password update
      const passwordSchema = z.object({
        currentPassword: z.string().min(8),
        newPassword: z.string().min(8),
      });
      const { currentPassword, newPassword } = passwordSchema.parse(request.body);

      // Get user
      const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!user) return reply.code(404).send({ error: 'User not found' });

      // Check current password
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return reply.code(400).send({ error: 'Current password is incorrect' });

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);

      // Update password
      await db.update(users)
        .set({ password: hashed })
        .where(eq(users.id, userId));

      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get current user's notification preferences
  server.get('/notifications', async (request, reply) => {
    try {
      const userId = request.user?.userId;
      if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
      const influencer = await db.query.influencers.findFirst({
        where: eq(influencers.userId, userId),
      });
      if (!influencer) return reply.code(404).send({ error: 'Influencer not found' });
      return reply.send({
        allowNotificationForCampaign: influencer.allowNotificationForCampaign,
        allowNotificationForApproval: influencer.allowNotificationForApproval,
      });
    } catch (error) {
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Update current user's notification preferences
  server.patch('/notifications', async (request, reply) => {
    try {
      const userId = request.user?.userId;
      if (!userId) return reply.code(401).send({ error: 'Unauthorized' });
      const schema = z.object({
        allowNotificationForCampaign: z.boolean(),
        allowNotificationForApproval: z.boolean(),
      });
      const body = schema.parse(request.body);
      const [updated] = await db.update(influencers)
        .set({
          allowNotificationForCampaign: body.allowNotificationForCampaign,
          allowNotificationForApproval: body.allowNotificationForApproval,
          updatedAt: new Date(),
        })
        .where(eq(influencers.userId, userId))
        .returning();
      if (!updated) return reply.code(404).send({ error: 'Influencer not found' });
      return reply.send({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors });
      }
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Connect Instagram and fetch analytics
  server.post('/connect-instagram', async (request, reply) => {
    console.log('Connect Instagram endpoint hit!');
    try {
      const userId = request.user?.userId;
      console.log('User ID:', userId);
      if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

      // Validate request body to include username
      const bodySchema = z.object({
        username: z.string().min(1, 'Username is required')
      });
      const { username } = bodySchema.parse(request.body);

      // Get influencer
      const influencer = await db.query.influencers.findFirst({
        where: eq(influencers.userId, userId),
      });
      console.log('Found influencer:', influencer?.id);

      if (!influencer) {
        return reply.code(404).send({ error: 'Influencer not found' });
      }

      // Check if already connected
      const existingAnalytics = await db.query.influencerInstaAnalytics.findFirst({
        where: eq(influencerInstaAnalytics.influencerId, influencer.id),
      });
      console.log('Existing analytics:', existingAnalytics?.id);

      if (existingAnalytics) {
        return reply.code(400).send({ 
          error: 'Already connected', 
          message: 'Instagram is already connected to your account' 
        });
      }

      console.log('Fetching from mock API...');
      // Fetch data from mock API
      const response = await fetch('https://my.api.mockaroo.com/influencer_analytics.json?key=bb9b3380');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Instagram analytics: ${response.statusText}`);
      }

      const analyticsData = await response.json();
      console.log('Analytics data received:', analyticsData);

      // Calculate male and female percentages
      const genderDistribution = analyticsData.gender_distribution_percentage;
      const malePercentage = parseFloat(genderDistribution.match(/(\d+)%/)[1]);
      const femalePercentage = 100 - malePercentage;

      console.log('Storing analytics in database...');
      // Store analytics in database
      const [newAnalytics] = await db.insert(influencerInstaAnalytics).values({
        influencerId: influencer.id,
        username: username,
        profilePictureUrl: analyticsData.profile_picture_url,
        followerCount: analyticsData.follower_count,
        averageEngagementRate: analyticsData.average_engagement_rate,
        malePercentage: malePercentage,
        femalePercentage: femalePercentage,
        audienceDemographicsAgeRange: analyticsData.audience_demographics_age_range,
        topAudienceLocation: analyticsData.top_audience_location,
        isConnected: true,
      }).returning();

      console.log('Analytics stored successfully:', newAnalytics.id);

      return {
        success: true,
        message: 'Instagram connected successfully',
        analytics: newAnalytics
      };

    } catch (error) {
      console.error('Error connecting Instagram:', error);
      return reply.code(500).send({ 
        error: 'Failed to connect Instagram',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test route for analytics
  server.get('/analytics', async (request, reply) => {
    console.log('Analytics test endpoint hit!');
    return { message: 'Analytics endpoint working' };
  });

  // Alternative Instagram analytics route
  server.get('/insta-analytics', async (request, reply) => {
    console.log('Alternative Instagram analytics endpoint hit!');
    try {
      const userId = request.user?.userId;
      console.log('User ID:', userId);
      if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

      // Get influencer
      const influencer = await db.query.influencers.findFirst({
        where: eq(influencers.userId, userId),
      });
      console.log('Found influencer:', influencer?.id);

      if (!influencer) {
        return reply.code(404).send({ error: 'Influencer not found' });
      }

      // Get analytics
      const analytics = await db.query.influencerInstaAnalytics.findFirst({
        where: eq(influencerInstaAnalytics.influencerId, influencer.id),
      });
      console.log('Found analytics:', analytics?.id);

      if (!analytics) {
        return reply.code(404).send({ error: 'Instagram not connected' });
      }

      return {
        success: true,
        analytics
      };

    } catch (error) {
      console.error('Error fetching Instagram analytics:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get Instagram analytics for current user
  server.get('/instagram-analytics', async (request, reply) => {
    console.log('Instagram analytics endpoint hit!');
    try {
      const userId = request.user?.userId;
      console.log('User ID:', userId);
      if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

      // Get influencer
      const influencer = await db.query.influencers.findFirst({
        where: eq(influencers.userId, userId),
      });
      console.log('Found influencer:', influencer?.id);

      if (!influencer) {
        return reply.code(404).send({ error: 'Influencer not found' });
      }

      // Get analytics
      const analytics = await db.query.influencerInstaAnalytics.findFirst({
        where: eq(influencerInstaAnalytics.influencerId, influencer.id),
      });
      console.log('Found analytics:', analytics?.id);

      if (!analytics) {
        return reply.code(404).send({ error: 'Instagram not connected' });
      }

      return {
        success: true,
        analytics
      };

    } catch (error) {
      console.error('Error fetching Instagram analytics:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Connect Facebook and fetch analytics
  server.post('/connect-facebook', async (request, reply) => {
    console.log('Connect Facebook endpoint hit!');
    try {
      const userId = request.user?.userId;
      if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

      // Validate request body to include username
      const bodySchema = z.object({
        username: z.string().min(1, 'Username is required')
      });
      const { username } = bodySchema.parse(request.body);

      const influencer = await db.query.influencers.findFirst({
        where: eq(influencers.userId, userId),
      });
      if (!influencer) return reply.code(404).send({ error: 'Influencer not found' });

      const existingAnalytics = await db.query.influencerFbAnalytics.findFirst({
        where: eq(influencerFbAnalytics.influencerId, influencer.id),
      });

      if (existingAnalytics) {
        return reply.code(400).send({
          error: 'Already connected',
          message: 'Facebook is already connected to your account'
        });
      }

      // Fetch data from mock API (using Instagram mock for now)
      const response = await fetch('https://my.api.mockaroo.com/influencer_analytics.json?key=bb9b3380');
      if (!response.ok) {
        throw new Error(`Failed to fetch Facebook analytics: ${response.statusText}`);
      }
      const analyticsData = await response.json();

      const genderDistribution = analyticsData.gender_distribution_percentage;
      const malePercentage = parseFloat(genderDistribution.match(/(\d+)%/)[1]);
      const femalePercentage = 100 - malePercentage;

      const [newAnalytics] = await db.insert(influencerFbAnalytics).values({
        influencerId: influencer.id,
        username: username,
        profilePictureUrl: analyticsData.profile_picture_url,
        followerCount: analyticsData.follower_count,
        averageEngagementRate: analyticsData.average_engagement_rate,
        malePercentage: malePercentage,
        femalePercentage: femalePercentage,
        audienceDemographicsAgeRange: analyticsData.audience_demographics_age_range,
        topAudienceLocation: analyticsData.top_audience_location,
        isConnected: true,
      }).returning();

      return {
        success: true,
        message: 'Facebook connected successfully',
        analytics: newAnalytics
      };

    } catch (error) {
      console.error('Error connecting Facebook:', error);
      return reply.code(500).send({
        error: 'Failed to connect Facebook',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get Facebook analytics for current user
  server.get('/facebook-analytics', async (request, reply) => {
    try {
      const userId = request.user?.userId;
      if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

      const influencer = await db.query.influencers.findFirst({
        where: eq(influencers.userId, userId),
      });
      if (!influencer) return reply.code(404).send({ error: 'Influencer not found' });

      const analytics = await db.query.influencerFbAnalytics.findFirst({
        where: eq(influencerFbAnalytics.influencerId, influencer.id),
      });

      if (!analytics) {
        return reply.code(404).send({ error: 'Facebook not connected' });
      }

      return { success: true, analytics };

    } catch (error) {
      console.error('Error fetching Facebook analytics:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Connect Twitter and fetch analytics
  server.post('/connect-twitter', async (request, reply) => {
    try {
      const userId = request.user?.userId;
      if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

      // Validate request body to include username
      const bodySchema = z.object({
        username: z.string().min(1, 'Username is required')
      });
      const { username } = bodySchema.parse(request.body);

      const influencer = await db.query.influencers.findFirst({
        where: eq(influencers.userId, userId),
      });
      if (!influencer) return reply.code(404).send({ error: 'Influencer not found' });

      const existingAnalytics = await db.query.influencerTwitterAnalytics.findFirst({
        where: eq(influencerTwitterAnalytics.influencerId, influencer.id),
      });

      if (existingAnalytics) {
        return reply.code(400).send({
          error: 'Already connected',
          message: 'Twitter is already connected to your account'
        });
      }

      const response = await fetch('https://my.api.mockaroo.com/influencer_analytics.json?key=bb9b3380');
      if (!response.ok) {
        throw new Error(`Failed to fetch Twitter analytics: ${response.statusText}`);
      }
      const analyticsData = await response.json();

      const genderDistribution = analyticsData.gender_distribution_percentage;
      const malePercentage = parseFloat(genderDistribution.match(/(\d+)%/)[1]);
      const femalePercentage = 100 - malePercentage;

      const [newAnalytics] = await db.insert(influencerTwitterAnalytics).values({
        influencerId: influencer.id,
        username: username,
        profilePictureUrl: analyticsData.profile_picture_url,
        followerCount: analyticsData.follower_count,
        averageEngagementRate: analyticsData.average_engagement_rate,
        malePercentage: malePercentage,
        femalePercentage: femalePercentage,
        audienceDemographicsAgeRange: analyticsData.audience_demographics_age_range,
        topAudienceLocation: analyticsData.top_audience_location,
        isConnected: true,
      }).returning();

      return {
        success: true,
        message: 'Twitter connected successfully',
        analytics: newAnalytics
      };

    } catch (error) {
      console.error('Error connecting Twitter:', error);
      return reply.code(500).send({
        error: 'Failed to connect Twitter',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get Twitter analytics for current user
  server.get('/twitter-analytics', async (request, reply) => {
    try {
      const userId = request.user?.userId;
      if (!userId) return reply.code(401).send({ error: 'Unauthorized' });

      const influencer = await db.query.influencers.findFirst({
        where: eq(influencers.userId, userId),
      });
      if (!influencer) return reply.code(404).send({ error: 'Influencer not found' });

      const analytics = await db.query.influencerTwitterAnalytics.findFirst({
        where: eq(influencerTwitterAnalytics.influencerId, influencer.id),
      });

      if (!analytics) {
        return reply.code(404).send({ error: 'Twitter not connected' });
      }

      return { success: true, analytics };

    } catch (error) {
      console.error('Error fetching Twitter analytics:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
} 