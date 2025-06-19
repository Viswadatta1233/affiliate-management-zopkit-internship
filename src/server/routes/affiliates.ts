import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { affiliateInvites, trackingLinks, users, products, commissionTiers, commissionRules, roles, affiliateProductCommissions, affiliateDetails, tenants } from '../db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { UserJwtPayload } from '../security';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Product, NewAffiliateProductCommission } from '../db/schema';

// Validation schemas
const inviteAffiliateSchema = z.object({
  email: z.string().email('Invalid email address'),
  productIds: z.array(z.string().uuid('Invalid product ID')),
  productCommissionSettings: z.record(z.string(), z.boolean()),
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

      // Check if all products exist and belong to tenant
      const productsList = await db.query.products.findMany({
        where: and(
          inArray(products.id, validatedData.productIds),
          eq(products.tenantId, tenantId)
        ),
      });

      if (productsList.length !== validatedData.productIds.length) {
        return reply.status(404).send({ error: 'One or more products not found' });
      }

      // Generate invite token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

      // Create invite
      const [invite] = await db.insert(affiliateInvites).values({
        tenantId,
        email: validatedData.email,
        productIds: validatedData.productIds,
        token,
        expiresAt,
        status: 'pending'
      }).returning();

      // Get commission tiers and rules for the email
      const tiers = await db.query.commissionTiers.findMany({
        where: eq(commissionTiers.tenantId, tenantId),
      });

      const rules = await db.query.commissionRules.findMany({
        where: eq(commissionRules.tenantId, tenantId),
      });

      // Find the commission tier with the lowest min_sales for the tenant
      let commissionTier = await db.query.commissionTiers.findFirst({
        where: eq(commissionTiers.tenantId, tenantId),
        orderBy: (tier) => tier.minSales,
      });

      // Create a default commission tier if none exists
      if (!commissionTier) {
        fastify.log.info('Creating default commission tier for tenant:', tenantId);
        [commissionTier] = await db.insert(commissionTiers).values({
          tenantId,
          tierName: 'Default Tier',
          commissionPercent: '10',
          minSales: 0,
        }).returning();
      }

      // Create affiliateProductCommission records for each product
      for (const product of productsList) {
        const productCommissionValue = product.commissionPercent ? Number(product.commissionPercent) : 0;
        const useProductCommission = validatedData.productCommissionSettings[product.id] || false;
        const finalCommission = useProductCommission ? productCommissionValue : Number(commissionTier.commissionPercent);
        
        await db.insert(affiliateProductCommissions).values({
          productId: product.id,
          tenantId,
          commissionTierId: commissionTier.id,
          commissionPercent: String(commissionTier.commissionPercent),
          productCommission: String(productCommissionValue),
          finalCommission: String(finalCommission),
        });
      }

      // Send email
      const acceptUrl = `http://localhost:5173/affiliate/accept?token=${token}`;
      try {
        await transporter.sendMail({
          from: "dattanidumukkala.98@gmail.com",
          to: validatedData.email,
          subject: 'Affiliate Program Invitation',
          html: `
            <h1>You've been invited to join our affiliate program!</h1>
            <p>Selected Products:</p>
            <ul>
              ${productsList.map(product => `
                <li>
                  <strong>${product.name}</strong><br>
                  Description: ${product.description || 'N/A'}<br>
                  Commission: ${product.commissionPercent}%
                </li>
              `).join('')}
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
        throw emailError;
      }

      return reply.status(201).send({ 
        message: 'Invitation sent successfully',
        invite: {
          id: invite.id,
          email: invite.email,
          status: invite.status,
          expiresAt: invite.expiresAt
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation error',
          details: error.errors 
        });
      }
      fastify.log.error('Error sending invite:', error);
      return reply.status(500).send({ 
        error: 'Failed to send invite',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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

      // Get all products from the invite
      const productIds = invite.productIds as string[];
      const productsList = await db.query.products.findMany({
        where: inArray(products.id, productIds),
      });

      // Create tracking links and commission records for each product
      for (const product of productsList) {
        // Check if tracking link already exists
        const existingTrackingLink = await db.query.trackingLinks.findFirst({
          where: and(
            eq(trackingLinks.affiliateId, user.id),
            eq(trackingLinks.productId, product.id)
          ),
        });

        let trackingLink;
        if (!existingTrackingLink) {
          // Create tracking link
          const trackingCode = crypto.randomBytes(8).toString('hex');
          [trackingLink] = await db.insert(trackingLinks).values({
            tenantId: invite.tenantId,
            affiliateId: user.id,
            productId: product.id,
            trackingCode: trackingCode,
            totalClicks: 0,
            totalConversions: 0,
            totalSales: '0',
          }).returning();
          fastify.log.info('Created new tracking link:', trackingLink);
        } else {
          trackingLink = existingTrackingLink;
        }

        // Find existing commission record
        const existingCommission = await db.query.affiliateProductCommissions.findFirst({
          where: and(
            eq(affiliateProductCommissions.productId, product.id),
            eq(affiliateProductCommissions.tenantId, invite.tenantId),
            isNull(affiliateProductCommissions.affiliateId)
          ),
        });

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
          const productCommissionValue = product.commissionPercent ? Number(product.commissionPercent) : 0;
          const finalCommission = productCommissionValue;

          // Get commission tier
          const commissionTier = await db.query.commissionTiers.findFirst({
            where: eq(commissionTiers.tenantId, invite.tenantId),
            orderBy: (tier) => tier.minSales,
          });

          if (!commissionTier) {
            throw new Error('No commission tier found');
          }

          await db.insert(affiliateProductCommissions).values({
            productId: product.id,
            tenantId: invite.tenantId,
            affiliateId: user.id,
            trackingLinkId: trackingLink.id,
            commissionTierId: commissionTier.id,
            commissionPercent: String(commissionTier.commissionPercent),
            productCommission: String(productCommissionValue),
            finalCommission: String(finalCommission),
          });
        }
      }

      // Update invite status
      await db.update(affiliateInvites)
        .set({ 
          status: 'accepted',
          acceptedAt: new Date(),
        })
        .where(eq(affiliateInvites.id, invite.id));
      fastify.log.info('Updated invite status');

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
        });
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
          where: inArray(products.id, productIds),
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

      // Fetch pending invites
      const pendingInvites = await db.query.affiliateInvites.findMany({
        where: and(
          eq(affiliateInvites.tenantId, tenantId),
          eq(affiliateInvites.status, 'pending')
        ),
        orderBy: (invites) => invites.createdAt
      });

      // Get product details for each invite
      const invitesWithProducts = await Promise.all(
        pendingInvites.map(async (invite) => {
          const productIds = invite.productIds as string[];
          const productList = await db.query.products.findMany({
            where: inArray(products.id, productIds),
            columns: {
              id: true,
              name: true,
              description: true,
              commissionPercent: true
            }
          });

          return {
            ...invite,
            product: productList[0] || null // Get the first product for display
          };
        })
      );

      return invitesWithProducts;
    } catch (error) {
      fastify.log.error('Error fetching pending invites:', error);
      return reply.status(500).send({ 
        error: 'Failed to fetch pending invites',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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
      // Fetch user info for name/email
      const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!user) return reply.status(404).send({ error: 'User not found' });
      // Merge and return
      return {
        ...details,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      };
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

  // Get all affiliates with their invited products and commission status
  fastify.get('/with-products', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const tenantId = request.user.tenantId;
      // Get all affiliates for this tenant
      const affiliates = await db.query.users.findMany({
        where: and(
          eq(users.tenantId, tenantId),
          eq(users.isAffiliate, true)
        ),
      });
      // For each affiliate, get their product commissions
      const affiliateIds = affiliates.map(a => a.id);
      const comms = affiliateIds.length > 0 ? await db.query.affiliateProductCommissions.findMany({
        where: inArray(affiliateProductCommissions.affiliateId, affiliateIds),
      }) : [];
      // Get all product info
      const productIds = comms.map(c => c.productId);
      const productsList = productIds.length > 0 ? await db.query.products.findMany({ where: inArray(products.id, productIds) }) : [];
      const productsById = Object.fromEntries(productsList.map(p => [p.id, p]));
      // Group comms by affiliate
      const commsByAffiliate: Record<string, any[]> = {};
      comms.forEach(c => {
        if (!commsByAffiliate[c.affiliateId!]) commsByAffiliate[c.affiliateId!] = [];
        commsByAffiliate[c.affiliateId!].push({
          id: c.productId,
          name: productsById[c.productId]?.name,
          commissionPercent: c.productCommission,
          finalCommission: c.finalCommission,
          useProductCommission: c.productCommission === c.finalCommission
        });
      });
      // Build result
      const result = affiliates.map(a => ({
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        products: commsByAffiliate[a.id] || []
      }));
      return result;
    } catch (error) {
      fastify.log.error('Error fetching affiliates with products:', error);
      return reply.status(500).send({ error: 'Failed to fetch affiliates with products' });
    }
  });

  // Update commission status for a specific affiliate-product pair
  fastify.put('/product-commission', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const { affiliateId, productId, useProductCommission } = request.body as {
        affiliateId: string,
        productId: string,
        useProductCommission: boolean
      };
      // Find the commission record
      const comm = await db.query.affiliateProductCommissions.findFirst({
        where: and(
          eq(affiliateProductCommissions.affiliateId, affiliateId),
          eq(affiliateProductCommissions.productId, productId)
        ),
      });
      if (!comm) {
        return reply.status(404).send({ error: 'Commission record not found' });
      }
      // Get product commission and tier commission
      const product = await db.query.products.findFirst({ where: eq(products.id, productId) });
      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      const productCommissionValue = product.commissionPercent ? Number(product.commissionPercent) : 0;
      // Get commission tier
      const commissionTier = await db.query.commissionTiers.findFirst({ where: eq(commissionTiers.id, comm.commissionTierId) });
      if (!commissionTier) {
        return reply.status(404).send({ error: 'Commission tier not found' });
      }
      const tierCommissionValue = Number(commissionTier.commissionPercent);
      // Update finalCommission
      const finalCommission = useProductCommission ? productCommissionValue : tierCommissionValue;
      await db.update(affiliateProductCommissions)
        .set({ finalCommission: String(finalCommission) })
        .where(and(
          eq(affiliateProductCommissions.affiliateId, affiliateId),
          eq(affiliateProductCommissions.productId, productId)
        ));
      return { message: 'Commission status updated' };
    } catch (error) {
      fastify.log.error('Error updating commission status:', error);
      return reply.status(500).send({ error: 'Failed to update commission status' });
    }
  });

  // Update an affiliate's tier
  fastify.put('/update-tier', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const { affiliateId, newTierId } = request.body as { affiliateId: string, newTierId: string };
      // Get the new tier
      const newTier = await db.query.commissionTiers.findFirst({ where: eq(commissionTiers.id, newTierId) });
      if (!newTier) {
        return reply.status(404).send({ error: 'Tier not found' });
      }
      // Update affiliate_details
      await db.update(affiliateDetails)
        .set({ currentTier: newTierId })
        .where(eq(affiliateDetails.userId, affiliateId));
      // Get all affiliate_product_commissions for this affiliate
      const comms = await db.query.affiliateProductCommissions.findMany({
        where: eq(affiliateProductCommissions.affiliateId, affiliateId),
      });
      // Update each commission record
      for (const comm of comms) {
        // If useProductCommission, keep finalCommission as productCommission, else use new tier percent
        const useProductCommission = comm.productCommission === comm.finalCommission;
        const newFinalCommission = useProductCommission ? comm.productCommission : String(newTier.commissionPercent);
        await db.update(affiliateProductCommissions)
          .set({
            commissionTierId: newTierId,
            commissionPercent: String(newTier.commissionPercent),
            finalCommission: newFinalCommission,
          })
          .where(eq(affiliateProductCommissions.id, comm.id));
      }
      return { message: 'Affiliate tier updated' };
    } catch (error) {
      fastify.log.error('Error updating affiliate tier:', error);
      return reply.status(500).send({ error: 'Failed to update affiliate tier' });
    }
  });

  // Update affiliate password
  fastify.put('/update-password', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const userId = request.user.userId;
      const { currentPassword, newPassword } = request.body as { currentPassword: string, newPassword: string };
      // Get user
      const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      // Check current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return reply.status(400).send({ error: 'Current password is incorrect' });
      }
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      // Update password
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, userId));
      return { message: 'Password updated successfully' };
    } catch (error) {
      fastify.log.error('Error updating password:', error);
      return reply.status(500).send({ error: 'Failed to update password' });
    }
  });

  // Get tracking links for the currently authenticated affiliate
  fastify.get('/tracking-links', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const affiliateId = request.user.userId;

      // Fetch all tracking links for this affiliate
      const trackingLinksList = await db.query.trackingLinks.findMany({
        where: eq(trackingLinks.affiliateId, affiliateId),
      });

      // Fetch product details for each tracking link
      const productIds = trackingLinksList.map(link => link.productId);
      let productsById: Record<string, any> = {};
      if (productIds.length > 0) {
        const productsList = await db.query.products.findMany({
          where: inArray(products.id, productIds),
        });
        productsById = Object.fromEntries(productsList.map(p => [p.id, p]));
      }

      // Attach product details to each tracking link
      const trackingLinksWithProduct = trackingLinksList.map(link => ({
        ...link,
        product: productsById[link.productId] || null,
      }));

      return trackingLinksWithProduct;
    } catch (error) {
      fastify.log.error('Error fetching affiliate tracking links:', error);
      return reply.status(500).send({ error: 'Failed to fetch tracking links' });
    }
  });
};

export default affiliateRoutes;