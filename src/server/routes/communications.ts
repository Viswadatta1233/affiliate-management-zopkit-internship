// import { FastifyInstance } from 'fastify';
// import { z } from 'zod';
// import { db } from '../db';
// import { notifications, notificationTemplates } from '../db/schema';
// import { eq, and } from 'drizzle-orm';

// const templateSchema = z.object({
//   name: z.string(),
//   type: z.enum(['email', 'sms', 'push']),
//   subject: z.string(),
//   content: z.string(),
//   variables: z.array(z.string()),
//   status: z.enum(['draft', 'active', 'inactive'])
// });

// const notificationSchema = z.object({
//   recipientId: z.string().uuid(),
//   templateId: z.string().uuid(),
//   channel: z.enum(['email', 'sms', 'push']),
//   data: z.record(z.string(), z.any()),
//   scheduledFor: z.date().optional()
// });

// export const communicationRoutes = async (server: FastifyInstance) => {
//   // Get notification templates
//   server.get('/templates', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     return db.query.notificationTemplates.findMany({
//       where: eq(notificationTemplates.tenantId, tenantId)
//     });
//   });

//   // Create notification template
//   server.post('/templates', async (request) => {
//     const body = templateSchema.parse(request.body);
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     const result = await db.insert(notificationTemplates)
//       .values({
//         ...body,
//         tenantId
//       })
//       .returning();
    
//     return result[0];
//   });

//   // Get notifications
//   server.get('/notifications', async (request) => {
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const userId = request.user.id;
    
//     return db.query.notifications.findMany({
//       where: and(
//         eq(notifications.tenantId, tenantId),
//         eq(notifications.recipientId, userId)
//       ),
//       orderBy: [{ createdAt: 'desc' }],
//       with: {
//         template: true
//       }
//     });
//   });

//   // Send notification
//   server.post('/notifications', async (request) => {
//     const body = notificationSchema.parse(request.body);
//     const tenantId = request.headers['x-tenant-id'] as string;
    
//     const result = await db.insert(notifications)
//       .values({
//         ...body,
//         tenantId,
//         status: 'pending'
//       })
//       .returning();
    
//     // Here you would typically trigger the actual notification sending
//     // through your preferred notification service
    
//     return result[0];
//   });

//   // Mark notification as read
//   server.post('/notifications/:id/read', async (request) => {
//     const { id } = request.params as { id: string };
//     const tenantId = request.headers['x-tenant-id'] as string;
//     const userId = request.user.id;
    
//     const result = await db.update(notifications)
//       .set({ readAt: new Date() })
//       .where(and(
//         eq(notifications.id, id),
//         eq(notifications.tenantId, tenantId),
//         eq(notifications.recipientId, userId)
//       ))
//       .returning();
    
//     return result[0];
//   });
// };