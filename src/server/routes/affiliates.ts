import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { affiliateInvites, trackingLinks, users, products, commissionTiers, commissionRules, roles, affiliateProductCommissions, affiliateDetails, tenants } from '../db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { UserJwtPayload } from '../security';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Validation schemas
const inviteAffiliateSchema = z.object({
  email: z.string().email('Invalid email address'),
  productId: z.string().uuid('Invalid product ID'),
});

const affiliateDetailsSchema = z.object({
  websiteUrl: z.string().url().optional(),
  socialMedia: z.record(z.string(), z.string()).optional(),
  promotionalMethods: z.array(z.string()).optional(),
});

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "dattanidumukkala.98@gmail.com",
    pass: "pbbmlywqphqiakpz",
  },
});

const affiliateRoutes: FastifyPluginAsync = async (fastify) => {
  // Invite affiliate
  fastify.post('/invite', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const tenantId = request.user.tenantId;
      const validatedData = inviteAffiliateSchema.parse(request.body);

      // Check if product exists and belongs to tenant
      const product = await db.query.products.findFirst({
        where: and(
          eq(products.id, validatedData.productId),
          eq(products.tenantId, tenantId)
        ),
      });

      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      // Generate invite token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

      // Create invite
      const [invite] = await db.insert(affiliateInvites).values({
        tenantId,
        email: validatedData.email,
        productId: validatedData.productId,
        token,
        expiresAt,
      }).returning();

      // Get commission tiers and rules for the email
      const tiers = await db.query.commissionTiers.findMany({
        where: eq(commissionTiers.tenantId, tenantId),
      });

      const rules = await db.query.commissionRules.findMany({
        where: eq(commissionRules.tenantId, tenantId),
      });

      // Find the commission tier with the lowest min_sales for the tenant
      const commissionTier = await db.query.commissionTiers.findFirst({
        where: eq(commissionTiers.tenantId, tenantId),
        orderBy: (tier) => tier.minSales,
      });
      if (!commissionTier) {
        return reply.status(400).send({ error: 'No commission tier found for tenant' });
      }
      // Get product commission
      const productCommissionValue = product.commissionPercent ? Number(product.commissionPercent) : 0;
      // Type-safe destructuring for addProductCommission
      const { addProductCommission } = request.body as { addProductCommission?: boolean };
      // Determine final commission
      const finalCommission = addProductCommission ? productCommissionValue : Number(commissionTier.commissionPercent);
      // Create affiliateProductCommission record (do not set affiliateId or trackingLinkId here)
      await db.insert(affiliateProductCommissions).values({
        productId: validatedData.productId,
        tenantId,
        commissionTierId: commissionTier.id,
        commissionPercent: Number(commissionTier.commissionPercent),
        productCommission: productCommissionValue,
        finalCommission,
      });

      // Send email
      const acceptUrl = `http://localhost:5173/affiliate/accept?token=${token}`;
      // if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      //   fastify.log.error('GMAIL_USER or GMAIL_PASS environment variables are not set');
      //   return reply.status(500).send({ error: 'Email configuration is missing' });
      // }
      try {
        await transporter.sendMail({
          from: "dattanidumukkala.98@gmail.com",
          to: validatedData.email,
          subject: 'Affiliate Program Invitation',
          html: `
            <h1>You've been invited to join our affiliate program!</h1>
            <p>Product Details:</p>
            <ul>
              <li>Name: ${product.name}</li>
              <li>Description: ${product.description || 'N/A'}</li>
              <li>Commission: ${product.commissionPercent}%</li>
            </ul>
            <p>Commission Tiers:</p>
            <ul>
              ${tiers.map(tier => `
                <li>${tier.tierName}: ${tier.commissionPercent}% (Min Sales: ${tier.minSales})</li>
              `).join('')}
            </ul>
            <p>Commission Rules:</p>
            <ul>
              ${rules.map(rule => `
                <li>${rule.name}: ${rule.description || 'N/A'}</li>
              `).join('')}
            </ul>
            <p>Click the link below to accept the invitation:</p>
            <a href="${acceptUrl}">Accept Invitation</a>
          `,
        });
      } catch (emailError) {
        fastify.log.error('Error sending email:', emailError);
        throw emailError; // Re-throw to be caught by the outer catch block
      }

      return { message: 'Invitation sent successfully' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation error',
          details: error.errors 
        });
      }
      fastify.log.error('Error sending invite:', error);
      // Log detailed error information
      fastify.log.error('Detailed error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      return reply.status(500).send({ error: 'Failed to send invite' });
    }
  });

  // Accept invite
  fastify.post('/accept', async (request, reply) => {
    try {
      const { token } = request.body as { token: string };
      if (!token) {
        return reply.status(400).send({ error: 'Token is required' });
      }
      fastify.log.info('Starting invite acceptance process with token:', token);

      // Find invite
      const invite = await db.query.affiliateInvites.findFirst({
        where: and(
          eq(affiliateInvites.token, token),
          eq(affiliateInvites.status, 'pending')
        ),
      });
      fastify.log.info('Found invite:', invite);

      if (!invite) {
        return reply.status(404).send({ error: 'Invalid or expired invite' });
      }

      if (new Date() > invite.expiresAt) {
        return reply.status(400).send({ error: 'Invite has expired' });
      }

      // Generate random password
      const password = crypto.randomBytes(8).toString('hex');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Get affiliate role
      let affiliateRole = await db.query.roles.findFirst({
        where: and(
          eq(roles.tenantId, invite.tenantId),
          eq(roles.roleName, 'affiliate')
        ),
      });
      fastify.log.info('Found affiliate role:', affiliateRole);

      if (!affiliateRole) {
        fastify.log.info('Creating default affiliate role');
        affiliateRole = (await db.insert(roles).values({
          tenantId: invite.tenantId,
          roleName: 'affiliate',
          description: 'Default affiliate role',
          permissions: ['view_reports'],
          isCustom: false,
        }).returning())[0];
        fastify.log.info('Created affiliate role:', affiliateRole);
      }

      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: and(
          eq(users.tenantId, invite.tenantId),
          eq(users.email, invite.email)
        ),
      });
      fastify.log.info('Existing user check:', existingUser);

      let user;
      if (existingUser) {
        // Update existing user to be an affiliate if they aren't already
        if (!existingUser.isAffiliate) {
          [user] = await db.update(users)
            .set({ 
              isAffiliate: true,
              roleId: affiliateRole.id 
            })
            .where(eq(users.id, existingUser.id))
            .returning();
          fastify.log.info('Updated existing user:', user);
        } else {
          user = existingUser;
        }
      } else {
        // Create new user account
        [user] = await db.insert(users).values({
          tenantId: invite.tenantId,
          email: invite.email,
          password: hashedPassword,
          firstName: 'New',
          lastName: 'Affiliate',
          isAffiliate: true,
          roleId: affiliateRole.id,
        }).returning();
        fastify.log.info('Created new user:', user);
      }

      // Check if tracking link already exists
      const existingTrackingLink = await db.query.trackingLinks.findFirst({
        where: and(
          eq(trackingLinks.affiliateId, user.id),
          eq(trackingLinks.productId, invite.productId)
        ),
      });
      fastify.log.info('Existing tracking link check:', existingTrackingLink);

      let trackingLink;
      if (!existingTrackingLink) {
        // Create tracking link
        const trackingCode = crypto.randomBytes(8).toString('hex');
        [trackingLink] = await db.insert(trackingLinks).values({
          tenantId: invite.tenantId,
          affiliateId: user.id,
          productId: invite.productId,
          trackingCode: trackingCode,
          totalClicks: 0,
          totalConversions: 0,
          totalSales: '0',
        }).returning();
        fastify.log.info('Created new tracking link:', trackingLink);
      } else {
        trackingLink = existingTrackingLink;
      }

      // Update invite status
      await db.update(affiliateInvites)
        .set({ 
          status: 'accepted',
          acceptedAt: new Date(),
        })
        .where(eq(affiliateInvites.id, invite.id));
      fastify.log.info('Updated invite status');

      // Find existing commission record
      const existingCommission = await db.query.affiliateProductCommissions.findFirst({
        where: and(
          eq(affiliateProductCommissions.productId, invite.productId),
          eq(affiliateProductCommissions.tenantId, invite.tenantId),
          isNull(affiliateProductCommissions.affiliateId)
        ),
      });
      fastify.log.info('Found commission record:', existingCommission);

      if (existingCommission) {
        // Update the commission record
        await db.update(affiliateProductCommissions)
          .set({
            affiliateId: user.id,
            trackingLinkId: trackingLink.id,
          })
          .where(eq(affiliateProductCommissions.id, existingCommission.id))
          .returning();
        fastify.log.info('Updated commission record');
      } else {
        // Create new commission record if none exists
        const commissionTier = await db.query.commissionTiers.findFirst({
          where: eq(commissionTiers.tenantId, invite.tenantId),
          orderBy: (tier) => tier.minSales,
        });
        
        if (!commissionTier) {
          // Create a default commission tier if none exists
          const [newTier] = await db.insert(commissionTiers).values({
            tenantId: invite.tenantId,
            tierName: 'Default Tier',
            commissionPercent: '10',
            minSales: 0,
          }).returning();
          fastify.log.info('Created default commission tier:', newTier);
          commissionTier = newTier;
        }

        const product = await db.query.products.findFirst({
          where: eq(products.id, invite.productId),
        });

        if (!product) {
          throw new Error('Product not found');
        }

        const productCommissionValue = product.commissionPercent ? Number(product.commissionPercent) : 0;
        const finalCommission = productCommissionValue || Number(commissionTier.commissionPercent);

        const [newCommission] = await db.insert(affiliateProductCommissions).values({
          productId: invite.productId,
          tenantId: invite.tenantId,
          affiliateId: user.id,
          trackingLinkId: trackingLink.id,
          commissionTierId: commissionTier.id,
          commissionPercent: Number(commissionTier.commissionPercent),
          productCommission: productCommissionValue,
          finalCommission,
        }).returning();
        fastify.log.info('Created new commission record:', newCommission);
      }

      return {
        message: 'Invite accepted successfully',
        credentials: existingUser ? undefined : {
          email: invite.email,
          password,
        },
      };
    } catch (error) {
      fastify.log.error('Error accepting invite:', error);
      if (error instanceof Error) {
        fastify.log.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name,
          cause: error.cause
        });
        
        // Check for specific error types
        if (error.message.includes('commission_tier_id')) {
          return reply.status(500).send({ 
            error: 'Failed to accept invite',
            details: 'Commission tier configuration error'
          });
        } else if (error.message.includes('tracking_link_id')) {
          return reply.status(500).send({ 
            error: 'Failed to accept invite',
            details: 'Tracking link configuration error'
          });
        } else if (error.message.includes('affiliate_id')) {
          return reply.status(500).send({ 
            error: 'Failed to accept invite',
            details: 'Affiliate user configuration error'
          });
        }
      }
      
      return reply.status(500).send({ 
        error: 'Failed to accept invite',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  // Get affiliate dashboard data
  fastify.get('/dashboard', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const affiliateId = request.user.userId;

      // Get tracking links for this affiliate
      const affiliateTrackingLinks = await db.query.trackingLinks.findMany({
        where: eq(trackingLinks.affiliateId, affiliateId),
      });

      // Fetch product details for each tracking link
      const productIds = affiliateTrackingLinks.map(link => link.productId);
      let productsById: Record<string, any> = {};
      if (productIds.length > 0) {
        const productsList = await db.query.products.findMany({
          where: (product) => productIds.includes(product.id),
        });
        productsById = Object.fromEntries(productsList.map(p => [p.id, p]));
      }

      // Attach product details to each tracking link
      const trackingLinksWithProduct = affiliateTrackingLinks.map(link => ({
        ...link,
        product: productsById[link.productId] || null,
      }));

      return {
        trackingLinks: trackingLinksWithProduct,
      };
    } catch (error) {
      fastify.log.error('Error fetching dashboard data:', error);
      return reply.status(500).send({ error: error instanceof Error ? error.message : 'Failed to fetch dashboard data' });
    }
  });

  // Get all affiliates for the tenant
  fastify.get('/', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const tenantId = request.user.tenantId;
      // Fetch all users with isAffiliate true for this tenant
      const affiliates = await db.query.users.findMany({
        where: and(
          eq(users.tenantId, tenantId),
          eq(users.isAffiliate, true)
        ),
      });
      return affiliates;
    } catch (error) {
      fastify.log.error('Error fetching affiliates:', error);
      return reply.status(500).send({ error: 'Failed to fetch affiliates' });
    }
  });

  // Get affiliate product commissions for dashboard
  fastify.get('/product-commissions', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const affiliateId = request.user.userId;
      // Fetch all product commissions for this affiliate
      const comms = await db.query.affiliateProductCommissions.findMany({
        where: eq(affiliateProductCommissions.affiliateId, affiliateId),
      });
      // Fetch product and tier info for each
      const productIds = comms.map(c => c.productId);
      const tierIds = comms.map(c => c.commissionTierId);
      const productsList = productIds.length > 0 ? await db.query.products.findMany({ where: inArray(products.id, productIds) }) : [];
      const tiersList = tierIds.length > 0 ? await db.query.commissionTiers.findMany({ where: inArray(commissionTiers.id, tierIds) }) : [];
      const productsById = Object.fromEntries(productsList.map(p => [p.id, p]));
      const tiersById = Object.fromEntries(tiersList.map(t => [t.id, t]));
      const result = comms.map(c => ({
        id: c.id,
        productName: productsById[c.productId]?.name,
        tierName: tiersById[c.commissionTierId]?.tierName,
        commissionPercent: c.commissionPercent,
        productCommission: c.productCommission,
        finalCommission: c.finalCommission,
      }));
      return result;
    } catch (error) {
      fastify.log.error('Error fetching product commissions:', error);
      return reply.status(500).send({ error: 'Failed to fetch product commissions' });
    }
  });

  // Get pending affiliate invites
  fastify.get('/pending-invites', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const tenantId = request.user.tenantId;

      // Fetch pending invites with product details
      const pendingInvites = await db.query.affiliateInvites.findMany({
        where: and(
          eq(affiliateInvites.tenantId, tenantId),
          eq(affiliateInvites.status, 'pending')
        ),
        with: {
          product: {
            columns: {
              id: true,
              name: true,
              description: true,
              commissionPercent: true
            }
          }
        },
        orderBy: (invites) => invites.createdAt
      });

      return pendingInvites;
    } catch (error) {
      fastify.log.error('Error fetching pending invites:', error);
      return reply.status(500).send({ error: 'Failed to fetch pending invites' });
    }
  });

  // Approve affiliate invite
  fastify.post('/approve/:id', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const tenantId = request.user.tenantId;
      const inviteId = (request.params as { id: string }).id;

      // Find invite
      const invite = await db.query.affiliateInvites.findFirst({
        where: and(
          eq(affiliateInvites.id, inviteId),
          eq(affiliateInvites.tenantId, tenantId),
          eq(affiliateInvites.status, 'pending')
        ),
      });

      if (!invite) {
        return reply.status(404).send({ error: 'Invite not found' });
      }

      // Update invite status
      await db.update(affiliateInvites)
        .set({ 
          status: 'accepted',
          acceptedAt: new Date(),
        })
        .where(eq(affiliateInvites.id, inviteId));

      return { message: 'Invite approved successfully' };
    } catch (error) {
      fastify.log.error('Error approving invite:', error);
      return reply.status(500).send({ error: 'Failed to approve invite' });
    }
  });

  // Reject affiliate invite
  fastify.post('/reject/:id', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const tenantId = request.user.tenantId;
      const inviteId = (request.params as { id: string }).id;

      // Find invite
      const invite = await db.query.affiliateInvites.findFirst({
        where: and(
          eq(affiliateInvites.id, inviteId),
          eq(affiliateInvites.tenantId, tenantId),
          eq(affiliateInvites.status, 'pending')
        ),
      });

      if (!invite) {
        return reply.status(404).send({ error: 'Invite not found' });
      }

      // Update invite status
      await db.update(affiliateInvites)
        .set({ 
          status: 'rejected',
        })
        .where(eq(affiliateInvites.id, inviteId));

      return { message: 'Invite rejected successfully' };
    } catch (error) {
      fastify.log.error('Error rejecting invite:', error);
      return reply.status(500).send({ error: 'Failed to reject invite' });
    }
  });

  // Get commission tiers for tenant
  fastify.get('/commission-tiers', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const tenantId = request.user.tenantId;

      // Fetch all commission tiers for this tenant
      const tiers = await db.query.commissionTiers.findMany({
        where: eq(commissionTiers.tenantId, tenantId),
        orderBy: (tier) => tier.minSales
      });

      return tiers;
    } catch (error) {
      fastify.log.error('Error fetching commission tiers:', error);
      return reply.status(500).send({ error: 'Failed to fetch commission tiers' });
    }
  });

  // Get all affiliates with their tier information
  fastify.get('/affiliates', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const tenantId = request.user.tenantId;

      // Fetch all users who are affiliates for this tenant
      const affiliates = await db.query.users.findMany({
        where: and(
          eq(users.tenantId, tenantId),
          eq(users.isAffiliate, true)
        ),
        with: {
          role: true
        }
      });

      // Get commission tier information for each affiliate
      const affiliatesWithTiers = await Promise.all(
        affiliates.map(async (affiliate) => {
          // Get the latest commission tier for this affiliate
          const latestCommission = await db.query.affiliateProductCommissions.findFirst({
            where: eq(affiliateProductCommissions.affiliateId, affiliate.id),
            orderBy: (commissions) => commissions.createdAt,
            with: {
              commissionTier: true
            }
          });

          return {
            id: affiliate.id,
            firstName: affiliate.firstName,
            lastName: affiliate.lastName,
            email: affiliate.email,
            commissionTierId: latestCommission?.commissionTierId || null,
            commissionTier: latestCommission?.commissionTier || null
          };
        })
      );

      return affiliatesWithTiers;
    } catch (error) {
      fastify.log.error('Error fetching affiliates:', error);
      return reply.status(500).send({ error: 'Failed to fetch affiliates' });
    }
  });

  // Get current affiliate's details (or by userId query param)
  fastify.get('/details', async (request, reply) => {
    try {
      // Accept userId from query param for admin view, or fallback to authenticated user
      const userId = (request.query as any).userId || request.user?.userId;
      if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
      // Try to find details
      let details = await db.query.affiliateDetails.findFirst({ where: eq(affiliateDetails.userId, userId) });
      if (!details) {
        // Auto-fill from backend
        const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
        if (!user) return reply.status(404).send({ error: 'User not found' });
        const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, user.tenantId) });
        // Get referral code from trackingLinks
        const tracking = await db.query.trackingLinks.findFirst({ where: eq(trackingLinks.affiliateId, userId) });
        // Get current tier from affiliateProductCommissions
        const commission = await db.query.affiliateProductCommissions.findFirst({ where: eq(affiliateProductCommissions.affiliateId, userId) });
        details = await db.insert(affiliateDetails).values({
          tenantId: user.tenantId,
          tenantName: tenant?.tenantName || '',
          userId: user.id,
          referralCode: tracking?.trackingCode || '',
          currentTier: commission?.commissionTierId || null,
          websiteUrl: '',
          socialMedia: {},
          promotionalMethods: [],
        }).returning().then(r => r[0]);
      }
      return details;
    } catch (error) {
      fastify.log.error('Error fetching affiliate details:', error);
      return reply.status(500).send({ error: 'Failed to fetch affiliate details' });
    }
  });

  // Update affiliate details (only editable fields)
  fastify.put('/details', async (request, reply) => {
    try {
      if (!request.user) return reply.status(401).send({ error: 'Unauthorized' });
      const userId = request.user.userId;
      const body = affiliateDetailsSchema.safeParse(request.body);
      if (!body.success) return reply.status(400).send({ error: body.error.flatten() });
      const { websiteUrl, socialMedia, promotionalMethods } = body.data;
      const [updated] = await db.update(affiliateDetails)
        .set({ websiteUrl, socialMedia, promotionalMethods, updatedAt: new Date() })
        .where(eq(affiliateDetails.userId, userId))
        .returning();
      return updated;
    } catch (error) {
      fastify.log.error('Error updating affiliate details:', error);
      return reply.status(500).send({ error: 'Failed to update affiliate details' });
    }
  });
};

export default affiliateRoutes;