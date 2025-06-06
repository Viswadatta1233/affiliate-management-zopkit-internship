import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { users, influencers, roles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcrypt';

const influencerRegistrationSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  social_links: z.object({
    instagram: z.string().url().optional(),
    youtube: z.string().url().optional(),
  }),
  niche: z.string(),
  country: z.string(),
  bio: z.string().optional(),
  agreedToTerms: z.boolean(),
});

export async function influencerRoutes(fastify: FastifyInstance) {
  // Register new influencer
  fastify.post('/register', async (request, reply) => {
    try {
      // Log the request
      fastify.log.debug({
        msg: 'Influencer registration request',
        body: request.body,
        headers: request.headers,
      });

      // Parse and validate the request body
      let data;
      try {
        data = influencerRegistrationSchema.parse(request.body);
      } catch (error) {
        fastify.log.error({
          msg: 'Validation error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return reply.status(400).send({
          error: 'Invalid input data',
          details: error instanceof z.ZodError ? error.errors : undefined,
        });
      }

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, data.email),
      });

      if (existingUser) {
        return reply.status(400).send({
          error: 'User with this email already exists',
        });
      }

      // Get the potential_influencer role
      let influencerRole;
      try {
        [influencerRole] = await db
          .select()
          .from(roles)
          .where(eq(roles.roleName, 'potential_influencer'))
          .limit(1);
      } catch (error) {
        fastify.log.error({
          msg: 'Error fetching influencer role',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return reply.status(500).send({
          error: 'Error fetching influencer role',
        });
      }

      if (!influencerRole) {
        return reply.status(500).send({
          error: 'Influencer role not found',
        });
      }

      // Create user with potential_influencer role
      let user;
      try {
        [user] = await db.insert(users).values({
          email: data.email,
          firstName: data.fullName.split(' ')[0],
          lastName: data.fullName.split(' ').slice(1).join(' '),
          phone: data.phone,
          roleId: influencerRole.id,
          password: await hash(Math.random().toString(36).slice(-8), 10), // Generate random password
          termsAccepted: data.agreedToTerms,
        }).returning();
      } catch (error) {
        fastify.log.error({
          msg: 'Error creating user',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return reply.status(500).send({
          error: 'Error creating user',
        });
      }

      // Create influencer profile
      let influencer;
      try {
        [influencer] = await db.insert(influencers).values({
          userId: user.id,
          socialMedia: data.social_links,
          niche: data.niche,
          country: data.country,
          bio: data.bio,
          status: 'pending',
          metrics: {
            followers: 0,
            engagement: 0,
            reach: 0,
            total_campaigns: 0,
            total_earnings: 0,
          },
        }).returning();
      } catch (error) {
        fastify.log.error({
          msg: 'Error creating influencer profile',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Try to clean up the user if influencer creation fails
        try {
          await db.delete(users).where(eq(users.id, user.id));
        } catch (cleanupError) {
          fastify.log.error({
            msg: 'Error cleaning up user after failed influencer creation',
            error: cleanupError instanceof Error ? cleanupError.message : 'Unknown error',
          });
        }
        return reply.status(500).send({
          error: 'Error creating influencer profile',
        });
      }

      // Log the successful registration
      fastify.log.debug({
        msg: 'Influencer registration successful',
        userId: user.id,
        influencerId: influencer.id,
      });

      return reply.status(201).send({
        message: 'Registration successful. Please wait for approval.',
        userId: user.id,
        influencerId: influencer.id,
      });
    } catch (error) {
      // Log the error
      fastify.log.error({
        msg: 'Unexpected error in influencer registration',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  // Get influencer profile
  fastify.get('/profile/:id', async (request, reply) => {
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
      fastify.log.error({
        msg: 'Error fetching influencer profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });
} 