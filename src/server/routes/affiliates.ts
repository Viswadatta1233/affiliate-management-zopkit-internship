import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { users, roles, affiliates, tenants, affiliateTiers } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { emailService } from '../services/email';
import { generateRandomPassword, hashPassword } from '../utils/password';

const affiliateSchema = z.object({
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  referralCode: z.string(),
  companyName: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  socialMedia: z.record(z.string(), z.any()).optional(),
  taxId: z.string().optional(),
  taxFormType: z.string().optional(),
  paymentThreshold: z.number().min(0),
  preferredCurrency: z.string().length(3),
  promotionalMethods: z.array(z.string())
});

const inviteAffiliateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  initialTier: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
});

export const affiliateRoutes = async (server: FastifyInstance) => {
  // Get all affiliates for a tenant
  server.get('/', async (request, reply) => {
    const tenantId = request.user?.tenantId;
    
    if (!tenantId) {
      return reply.code(400).send({ error: 'Tenant ID is required' });
    }

    const results = await db.query.affiliates.findMany({
      where: eq(affiliates.tenantId, tenantId),
      with: {
        user: true,
        currentTier: true,
      },
    });

    return results;
  });

  // Get affiliate by ID
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      return reply.code(400).send({ error: 'Tenant ID is required' });
    }

    const affiliate = await db.query.affiliates.findFirst({
      where: and(
        eq(affiliates.id, id),
        eq(affiliates.tenantId, tenantId)
      ),
      with: {
        user: true,
        currentTier: true,
        trackingLinks: true,
        sales: {
          orderBy: [{ createdAt: 'desc' }],
          limit: 10
        },
        campaignParticipations: {
          with: {
            campaign: true
          }
        }
      }
    });

    if (!affiliate) {
      return reply.code(404).send({ error: 'Affiliate not found' });
    }

    return affiliate;
  });

  // Create new affiliate
  server.post('/', async (request, reply) => {
    const body = affiliateSchema.parse(request.body);
    
    const result = await db.insert(affiliates).values(body).returning();
    
    return result[0];
  });

  // Invite a new affiliate by email
  server.post('/invite', async (request, reply) => {
    try {
      console.log('Received invite request with body:', request.body);
      
      const { email, firstName, lastName, initialTier, commissionRate } = inviteAffiliateSchema.parse(request.body);
      console.log('Parsed data:', { email, firstName, lastName, initialTier, commissionRate });
      
      const tenantId = request.tenantId;
      console.log('TenantId from request:', tenantId);
      
      if (!tenantId) {
        console.error('No tenant ID in request');
        return reply.code(400).send({ error: 'Tenant ID is required' });
      }

      // Ensure default tiers exist
      await ensureDefaultTiers(tenantId);
      
      try {
        // Check if user with this email already exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, email)
        });
        
        if (existingUser) {
          // Check if user is already an affiliate
          const existingAffiliate = await db.query.affiliates.findFirst({
            where: eq(affiliates.userId, existingUser.id)
          });

          if (existingAffiliate) {
            console.log('User is already an affiliate:', email);
            return reply.code(400).send({ 
              error: 'User is already an affiliate',
              details: 'This email address is already registered as an affiliate.'
            });
          }

          // If user exists but is not an affiliate, we can convert them
          console.log('Converting existing user to affiliate:', email);
          
          // Find or create affiliate role
          let affiliateRole = await db.query.roles.findFirst({
            where: and(
              eq(roles.tenantId, tenantId),
              eq(roles.roleName, 'Affiliate')
            )
          });

          if (!affiliateRole) {
            console.log('Creating new Affiliate role');
            try {
              const [newRole] = await db.insert(roles).values({
                tenantId,
                roleName: 'Affiliate',
                description: 'Affiliate role with limited access',
                permissions: ['view_dashboard', 'manage_links', 'view_commissions'],
                isCustom: false,
              }).returning();
              affiliateRole = newRole;
            } catch (roleError) {
              console.error('Error creating affiliate role:', roleError);
              throw new Error('Failed to create affiliate role');
            }
          }

          // Update user's role and affiliate status
          await db.update(users)
            .set({ 
              roleId: affiliateRole.id,
              isAffiliate: true 
            })
            .where(eq(users.id, existingUser.id));

          // Generate referral code
          const referralCode = `${(firstName || email.split('@')[0]).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
          
          // Create affiliate record
          const [affiliate] = await db.insert(affiliates).values({
            tenantId,
            userId: existingUser.id,
            referralCode,
            initialTierId: initialTier ? await getAffiliateTierId(initialTier, tenantId) : null,
            paymentThreshold: 50,
            preferredCurrency: 'USD',
            promotionalMethods: ['website', 'social_media'],
            status: 'pending',
          }).returning();

          return {
            success: true,
            message: 'Existing user converted to affiliate successfully',
            affiliate: {
              id: affiliate.id,
              email,
              status: 'pending',
            }
          };
        }
        
        // Get tenant information
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, tenantId)
        });
        
        if (!tenant) {
          console.error('Tenant not found for ID:', tenantId);
          return reply.code(404).send({ error: 'Tenant not found' });
        }
        
        console.log('Found tenant:', tenant.tenantName);
        
        // Find affiliate role
        let affiliateRole = await db.query.roles.findFirst({
          where: and(
            eq(roles.tenantId, tenantId),
            eq(roles.roleName, 'Affiliate')
          )
        });
        
        // If affiliate role doesn't exist, create it
        if (!affiliateRole) {
          console.log('Creating new Affiliate role');
          try {
            const [newRole] = await db.insert(roles).values({
              tenantId,
              roleName: 'Affiliate',
              description: 'Affiliate role with limited access',
              permissions: ['view_dashboard', 'manage_links', 'view_commissions'],
              isCustom: false,
            }).returning();
            affiliateRole = newRole;
          } catch (roleError) {
            console.error('Error creating affiliate role:', roleError);
            throw new Error('Failed to create affiliate role');
          }
        }
        
        if (!affiliateRole) {
          throw new Error('Failed to get or create affiliate role');
        }
        
        console.log('Using role:', affiliateRole.id);
        
        // Generate random password
        const randomPassword = generateRandomPassword();
        const hashedPassword = await hashPassword(randomPassword);
        
        console.log('Generated password and hashed it');
        
        let user;
        try {
          // Create user with affiliate role
          [user] = await db.insert(users).values({
            tenantId,
            email,
            firstName: firstName || email.split('@')[0],
            lastName: lastName || '',
            password: hashedPassword,
            roleId: affiliateRole.id,
            isAffiliate: true,
            termsAccepted: true,
          }).returning();
          
          console.log('Created user:', user.id);
        } catch (userError) {
          console.error('Error creating user:', userError);
          throw new Error('Failed to create user account');
        }
        
        try {
          // Generate referral code
          const referralCode = `${(firstName || email.split('@')[0]).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
          
          // Create affiliate record
          const [affiliate] = await db.insert(affiliates).values({
            tenantId,
            userId: user.id,
            referralCode,
            initialTierId: initialTier ? await getAffiliateTierId(initialTier, tenantId) : null,
            paymentThreshold: 50,
            preferredCurrency: 'USD',
            promotionalMethods: ['website', 'social_media'],
            status: 'pending',
          }).returning();
          
          console.log('Created affiliate record:', affiliate.id);
          
          // Generate invite link
          const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const inviteLink = `${baseUrl}/login?email=${encodeURIComponent(email)}&invited=true`;
          
          // Send invitation email
          try {
            console.log('Attempting to send invitation email');
            await emailService.sendAffiliateInvitation({
              email,
              password: randomPassword,
              tenantName: tenant.tenantName,
              inviteLink,
            });
            console.log('Email sent successfully');
          } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Continue with the process even if email fails
          }
          
          return {
            success: true,
            message: 'Invitation sent successfully',
            affiliate: {
              id: affiliate.id,
              email,
              status: 'pending',
            }
          };
        } catch (affiliateError) {
          console.error('Error creating affiliate record:', affiliateError);
          // If affiliate creation fails, clean up the user
          if (user) {
            await db.delete(users).where(eq(users.id, user.id));
          }
          throw new Error('Failed to create affiliate record');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        return reply.code(500).send({ 
          error: 'Database operation failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error' 
        });
      }
    } catch (error) {
      console.error('Error inviting affiliate:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ 
          error: 'Invalid input data',
          details: error.errors 
        });
      }
      return reply.code(500).send({ 
        error: 'Failed to send invitation',
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Update affiliate
  server.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = affiliateSchema.partial().parse(request.body);
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      return reply.code(400).send({ error: 'Tenant ID is required' });
    }

    const result = await db.update(affiliates)
      .set(body)
      .where(and(
        eq(affiliates.id, id),
        eq(affiliates.tenantId, tenantId)
      ))
      .returning();

    if (!result.length) {
      return reply.code(404).send({ error: 'Affiliate not found' });
    }

    return result[0];
  });

  // Approve affiliate
  server.post('/:id/approve', async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.user?.tenantId;
    const userId = request.user?.userId;

    if (!tenantId) {
      return reply.code(400).send({ error: 'Tenant ID is required' });
    }

    const result = await db.update(affiliates)
      .set({
        status: 'active',
        approvedBy: userId,
        approvedAt: new Date()
      })
      .where(and(
        eq(affiliates.id, id),
        eq(affiliates.tenantId, tenantId),
        eq(affiliates.status, 'pending')
      ))
      .returning();

    if (!result.length) {
      return reply.code(404).send({ error: 'Affiliate not found or already approved' });
    }

    return result[0];
  });

  // Reject affiliate
  server.post('/:id/reject', async (request, reply) => {
    const { id } = request.params as { id: string };
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      return reply.code(400).send({ error: 'Tenant ID is required' });
    }

    const result = await db.update(affiliates)
      .set({ status: 'rejected' })
      .where(and(
        eq(affiliates.id, id),
        eq(affiliates.tenantId, tenantId),
        eq(affiliates.status, 'pending')
      ))
      .returning();

    if (!result.length) {
      return reply.code(404).send({ error: 'Affiliate not found or already processed' });
    }

    return result[0];
  });
};

async function getAffiliateTierId(tierName: string, tenantId: string) {
  const tier = await db.query.affiliateTiers.findFirst({
    where: and(
      eq(affiliateTiers.name, tierName.toLowerCase()),
      eq(affiliateTiers.tenantId, tenantId)
    )
  });
  return tier?.id || null;
}

async function ensureDefaultTiers(tenantId: string) {
  const defaultTiers = [
    {
      name: 'bronze',
      description: 'Entry level affiliate tier',
      commissionRate: 5,
      minimumSales: 0,
      benefits: ['Basic commission rates', 'Standard support']
    },
    {
      name: 'silver',
      description: 'Mid-level affiliate tier',
      commissionRate: 10,
      minimumSales: 1000,
      benefits: ['Higher commission rates', 'Priority support', 'Monthly newsletter']
    },
    {
      name: 'gold',
      description: 'Top-level affiliate tier',
      commissionRate: 15,
      minimumSales: 5000,
      benefits: ['Premium commission rates', 'VIP support', 'Early access to promotions', 'Custom marketing materials']
    }
  ];

  for (const tier of defaultTiers) {
    const existingTier = await db.query.affiliateTiers.findFirst({
      where: and(
        eq(affiliateTiers.name, tier.name),
        eq(affiliateTiers.tenantId, tenantId)
      )
    });

    if (!existingTier) {
      console.log(`Creating default tier: ${tier.name}`);
      await db.insert(affiliateTiers).values({
        tenantId,
        name: tier.name,
        description: tier.description,
        commissionRate: tier.commissionRate,
        minimumSales: tier.minimumSales,
        benefits: tier.benefits
      });
    }
  }
}