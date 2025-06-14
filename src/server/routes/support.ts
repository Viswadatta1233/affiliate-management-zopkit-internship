import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { supportTickets, insertSupportTicketSchema } from '../db/schema';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

// Cloudinary config (reuse from marketing.ts or use env vars)
cloudinary.config({
  cloud_name: "dpfszdyq9",
  api_key: "997635961425226",
  api_secret: "E00loG3a5v1wXxWhm4Uyf1q9v60",
});

export const supportRoutes = async (server: FastifyInstance) => {
  server.post('/tickets', async (request, reply) => {
    try {
      const userId = (request.headers['x-user-id'] as string) || '';
      const tenantId = (request.headers['x-tenant-id'] as string) || '';
      if (!userId || !tenantId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      let issueType = '', subject = '', description = '', fileUrl: string | undefined = undefined;
      let buffer: Buffer | null = null;
      // Parse multipart
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file' && part.fieldname === 'file') {
          buffer = await part.toBuffer();
        } else if (part.type === 'field') {
          if (part.fieldname === 'issueType') issueType = String(part.value);
          if (part.fieldname === 'subject') subject = String(part.value);
          if (part.fieldname === 'description') description = String(part.value);
        }
      }
      if (!issueType || !subject || !description) {
        return reply.code(400).send({ error: 'Missing required fields' });
      }
      if (buffer && buffer.length > 0) {
        // Upload to Cloudinary
        const uploadResult = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `tenants/${tenantId}/support-tickets`,
              resource_type: 'image',
              timeout: 60000
            },
            (error, result) => {
              if (error) reject(error);
              else if (!result) reject(new Error('Cloudinary upload failed: No result'));
              else resolve(result);
            }
          );
          uploadStream.end(buffer);
        });
        fileUrl = uploadResult.secure_url;
      }
      const ticket = {
        id: uuidv4(),
        userId,
        tenantId,
        issueType,
        subject,
        description,
        fileUrl,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const parsed = insertSupportTicketSchema.safeParse(ticket);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.errors });
      }
      await db.insert(supportTickets).values(ticket);
      return reply.code(201).send({ ticketNumber: ticket.id });
    } catch (err) {
      console.error('Support ticket error:', err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}; 