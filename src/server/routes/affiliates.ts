import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { users, roles, affiliates, tenants, affiliateTiers, affiliateProductCommissions } from '../db/schema';
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
  paymentThreshold: z.number().min(0).transform(val => val.toString()),
  preferredCurrency: z.string().length(3),
  promotionalMethods: z.array(z.string()),
  status: z.enum(['pending', 'active', 'rejected', 'suspended']).optional(),
  initialTierId: z.string().uuid().optional()
});

const inviteAffiliateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  initialTier: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  productCommissions: z.array(z.object({
    productId: z.string().uuid(),
    commissionRate: z.number().min(0).max(100),
    commissionType: z.enum(['percentage', 'fixed']).default('percentage')
  })).optional()
});

// Helper function to get or create affiliate role
async function getAffiliateRoleId(tenantId: string): Promise<string> {
  let affiliateRole = await db.query.roles.findFirst({
    where: and(
      eq(roles.tenantId, tenantId),
      eq(roles.roleName, 'Affiliate')
    )
  });

  if (!affiliateRole) {
    const [newRole] = await db.insert(roles).values({
      tenantId,
      roleName: 'Affiliate',
      description: 'Affiliate role with limited access',
      permissions: ['view_dashboard', 'manage_links', 'view_commissions'],
      isCustom: false,
    }).returning();
    affiliateRole = newRole;
  }

  return affiliateRole.id;
}

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
        currentTier: true
      }
    });

    if (!affiliate) {
      return reply.code(404).send({ error: 'Affiliate not found' });
    }

    return affiliate;
  });

  // Create new affiliate
  server.post('/', async (request, reply) => {
    const parsedBody = affiliateSchema.parse(request.body);
    
    // Convert paymentThreshold to string if it exists
    const body = {
      ...parsedBody,
      paymentThreshold: parsedBody.paymentThreshold?.toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.insert(affiliates).values(body).returning();
    return result[0];
  });

  // Invite a new affiliate by email
  server.post('/invite', async (request, reply) => {
    try {
      console.log('Received invite request:', request.body);
      
      const { email, firstName, lastName, initialTier, commissionRate, productCommissions } = inviteAffiliateSchema.parse(request.body);
      
      const tenantId = request.tenantId;
      if (!tenantId) {
        return reply.code(400).send({ error: 'Tenant ID is required' });
      }

      // Get tenant information for email
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId)
      });

      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }

      try {
        // Check if user with this email already exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, email),
          with: {
            tenant: true,
            role: true
          }
        });

        // Check if user is already an affiliate
        if (existingUser) {
          const existingAffiliate = await db.query.affiliates.findFirst({
            where: eq(affiliates.userId, existingUser.id)
          });

          if (existingAffiliate) {
            return reply.code(400).send({ 
              error: 'User is already an affiliate',
              details: 'This email address is already registered as an affiliate.'
            });
          }
        }

        // Generate random password and hash it
        const generatedPassword = generateRandomPassword();
        const hashedPassword = await hashPassword(generatedPassword);

        // Create or update user
        let user;
        try {
          if (existingUser) {
            // Update existing user
            const [updatedUser] = await db.update(users)
              .set({
                roleId: await getAffiliateRoleId(tenantId),
                isAffiliate: true
              })
              .where(eq(users.id, existingUser.id))
              .returning();
            user = updatedUser;
          } else {
            // Create new user
            const [newUser] = await db.insert(users)
              .values({
                email,
                firstName: firstName || email.split('@')[0],
                lastName: lastName || 'Affiliate',
                password: hashedPassword,
                tenantId,
                roleId: await getAffiliateRoleId(tenantId),
                isAffiliate: true
              })
              .returning();
            user = newUser;
          }
        } catch (dbError) {
          console.error('Error creating/updating user:', dbError);
          return reply.code(500).send({ 
            error: 'Failed to create user account',
            details: dbError instanceof Error ? dbError.message : 'Database error'
          });
        }

        // Generate referral code
        const referralCode = `${(firstName || email.split('@')[0]).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        try {
          // Create affiliate record
          const [affiliate] = await db.insert(affiliates)
            .values({
              tenantId: tenantId,
              userId: user.id,
              referralCode: referralCode,
              initialTierId: initialTier ? await getAffiliateTierId(initialTier, tenantId) : null,
              paymentThreshold: '50',
              preferredCurrency: 'USD',
              promotionalMethods: ['website', 'social_media'],
              status: 'pending',
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();

          // Create product-specific commission rates if provided
          if (productCommissions && productCommissions.length > 0) {
            try {
              const commissionValues = productCommissions.map(pc => ({
                affiliateId: affiliate.id,
                productId: pc.productId,
                commissionRate: pc.commissionRate.toString(),
                commissionType: pc.commissionType,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
              }));
              
              await db.insert(affiliateProductCommissions)
                .values(commissionValues);
            } catch (commissionError) {
              console.error('Error creating product commissions:', commissionError);
              // Don't fail the whole process if product commissions fail
              // We'll still create the affiliate without product-specific rates
            }
          }
          
          // Generate invite link
          const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
          const inviteLink = `${baseUrl}/login?email=${encodeURIComponent(email)}&invited=true`;
          
          // Send invitation email
          try {
            await emailService.sendAffiliateInvitation({
              email,
              password: generatedPassword,
              tenantName: tenant.tenantName,
              inviteLink,
            });
          } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Continue with the process even if email fails
          }
          
          return {
            success: true,
            message: existingUser ? 'Existing user converted to affiliate successfully' : 'Invitation sent successfully',
            affiliate: {
              id: affiliate.id,
              email,
              status: 'pending',
            }
          };
        } catch (affiliateError) {
          console.error('Error creating affiliate:', affiliateError);
          return reply.code(500).send({ 
            error: 'Failed to create affiliate record',
            details: affiliateError instanceof Error ? affiliateError.message : 'Database error'
          });
        }
      } catch (dbError) {
        console.error('Database operation error:', dbError);
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
    const parsedBody = affiliateSchema.partial().parse(request.body);
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      return reply.code(400).send({ error: 'Tenant ID is required' });
    }

    // Convert paymentThreshold to string if it exists
    const body = {
      ...parsedBody,
      paymentThreshold: parsedBody.paymentThreshold?.toString(),
      updatedAt: new Date()
    };

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
      commissionRate: '5',
      minimumSales: '0',
      benefits: ['Basic commission rates', 'Standard support']
    },
    {
      name: 'silver',
      description: 'Mid-level affiliate tier',
      commissionRate: '10',
      minimumSales: '1000',
      benefits: ['Higher commission rates', 'Priority support', 'Monthly newsletter']
    },
    {
      name: 'gold',
      description: 'Top-level affiliate tier',
      commissionRate: '15',
      minimumSales: '5000',
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
      await db.insert(affiliateTiers)
        .values({
          name: tier.name,
          description: tier.description,
          commissionRate: tier.commissionRate,
          minimumSales: tier.minimumSales,
          benefits: tier.benefits,
          tenantId: tenantId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
  }
}