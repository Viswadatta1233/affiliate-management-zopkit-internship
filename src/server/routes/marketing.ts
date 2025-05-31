import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { marketingAssets, marketingGuidelines } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config (replace with your env vars)
cloudinary.config({
  cloud_name: "dpfszdyq9",
  api_key: "997635961425226",
  api_secret: "E00loG3a5v1wXxWhm4Uyf1q9v60",
});

export const marketingRoutes = async (server: FastifyInstance) => {
  // Upload asset (logo/banner/other)
  server.post('/assets', async (request, reply) => {
    try {
      console.log("Received request");
      const tenantId = request.headers['x-tenant-id'] as string;
      console.log("Tenant ID:", tenantId);

      if (!tenantId) {
        return reply.code(400).send({ error: 'Missing tenant ID' });
      }

      let filePart = null;
      let type: string | undefined = undefined;

      // Process multipart data
      const parts = request.parts();
      let buffer: Buffer | null = null;
      
      for await (const part of parts) {
        console.log("Processing part:", part.fieldname, part.type);
        
        if (part.type === 'file' && part.fieldname === 'file') {
          console.log("Found file part:", part.filename);
          // Buffer the file immediately when we encounter it
          console.log("About to buffer file...");
          buffer = await part.toBuffer();
          console.log("Buffer size:", buffer.length);
          filePart = part; // Keep reference for filename, etc.
        } else if (part.type === 'field' && part.fieldname === 'type') {
          console.log("Found type field:", part.value);
          type = String(part.value);
        }
      }

      // Validate required fields
      if (!buffer || !filePart) {
        console.log("No file uploaded or failed to buffer");
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      if (!type || !['logo', 'banner', 'other'].includes(type)) {
        console.log("Missing or invalid asset type:", type);
        return reply.code(400).send({ error: 'Missing or invalid asset type' });
      }

      if (buffer.length === 0) {
        return reply.code(400).send({ error: 'Empty file uploaded' });
      }

      // Upload to Cloudinary
      console.log('Uploading to Cloudinary...');
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            folder: `tenants/${tenantId}/brand-assets`, 
            resource_type: 'image',
            timeout: 60000 // 60 second timeout
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload failed:', error);
              reject(error);
            } else if (!result) {
              console.error('Cloudinary upload failed: No result');
              reject(new Error('Cloudinary upload failed: No result'));
            } else {
              console.log('Cloudinary upload successful:', result.secure_url);
              resolve(result);
            }
          }
        );
        
        uploadStream.end(buffer);
      });

      // Save to database
      console.log('Saving to database...');
      const [asset] = await db.insert(marketingAssets).values({
        tenantId,
        type: type as 'logo' | 'banner' | 'other',
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      }).returning();

      console.log('Asset saved successfully:', asset.id);
      return reply.send(asset);

    } catch (error) {
      console.error("Upload error:", error);
      return reply.code(500).send({ 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // List assets
  server.get('/assets', async (request, reply) => {
    try {
      const tenantId = request.headers['x-tenant-id'] as string;
      
      if (!tenantId) {
        return reply.code(400).send({ error: 'Missing tenant ID' });
      }

      const assets = await db.select().from(marketingAssets)
        .where(eq(marketingAssets.tenantId, tenantId))
        .orderBy(marketingAssets.uploadedAt);

      return reply.send(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      return reply.code(500).send({ error: 'Failed to fetch assets' });
    }
  });

  // Save/update guidelines
  server.post('/guidelines', async (request, reply) => {
    try {
      const tenantId = request.headers['x-tenant-id'] as string;
      const { content } = request.body as { content: string };

      if (!tenantId) {
        return reply.code(400).send({ error: 'Missing tenant ID' });
      }

      if (typeof content !== 'string') {
        return reply.code(400).send({ error: 'Invalid content' });
      }

      // Upsert
      const existing = await db.select().from(marketingGuidelines)
        .where(eq(marketingGuidelines.tenantId, tenantId));

      let result;
      if (existing.length > 0) {
        result = await db.update(marketingGuidelines)
          .set({ content, updatedAt: new Date() })
          .where(eq(marketingGuidelines.tenantId, tenantId))
          .returning();
      } else {
        result = await db.insert(marketingGuidelines)
          .values({ tenantId, content })
          .returning();
      }

      return reply.send(result[0]);
    } catch (error) {
      console.error("Error saving guidelines:", error);
      return reply.code(500).send({ error: 'Failed to save guidelines' });
    }
  });

  // Get guidelines
  server.get('/guidelines', async (request, reply) => {
    try {
      const tenantId = request.headers['x-tenant-id'] as string;
      
      if (!tenantId) {
        return reply.code(400).send({ error: 'Missing tenant ID' });
      }

      const [guidelines] = await db.select().from(marketingGuidelines)
        .where(eq(marketingGuidelines.tenantId, tenantId));

      return reply.send(guidelines || { content: '' });
    } catch (error) {
      console.error("Error fetching guidelines:", error);
      return reply.code(500).send({ error: 'Failed to fetch guidelines' });
    }
  });
};