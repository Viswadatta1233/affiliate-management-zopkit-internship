import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { products } from '../db/schema';
import { eq } from 'drizzle-orm';
import { UserJwtPayload } from '../security';

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  sku: z.string().min(1, 'SKU is required'),
  commission_percent: z.coerce.number().min(0, 'Commission must be at least 0').max(100, 'Commission cannot exceed 100'),
  status: z.enum(['active', 'inactive']),
});

const updateProductSchema = createProductSchema.partial();

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: UserJwtPayload;
  }
}

const productRoutes: FastifyPluginAsync = async (fastify) => {
  // Get all products for tenant
  fastify.get('/', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const tenantId = request.user.tenantId;
      const allProducts = await db.query.products.findMany({
        where: eq(products.tenantId, tenantId),
      });
      
      // Convert string values to numbers for the frontend
      return allProducts.map(product => ({
        ...product,
        price: parseFloat(product.price || '0'),
        commission_percent: parseFloat(product.commissionPercent || '0'),
      }));
    } catch (error) {
      fastify.log.error('Error fetching products:', error);
      return reply.status(500).send({ error: 'Failed to fetch products' });
    }
  });

  // Get single product
  fastify.get('/:id', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId;
      
      const product = await db.query.products.findFirst({
        where: eq(products.id, id),
      });

      if (!product || product.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      // Convert string values to numbers for the frontend
      return {
        ...product,
        price: parseFloat(product.price || '0'),
        commission_percent: parseFloat(product.commissionPercent || '0'),
      };
    } catch (error) {
      fastify.log.error('Error fetching product:', error);
      return reply.status(500).send({ error: 'Failed to fetch product' });
    }
  });

  // Create product
  fastify.post('/', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const tenantId = request.user.tenantId;
      const validatedData = createProductSchema.parse(request.body);

      const [newProduct] = await db.insert(products).values({
        ...validatedData,
        tenantId: tenantId,
        price: validatedData.price.toString(),
        commissionPercent: validatedData.commission_percent.toString(),
      }).returning();

      // Convert string values to numbers for the frontend
      return reply.status(201).send({
        ...newProduct,
        price: parseFloat(newProduct.price || '0'),
        commission_percent: parseFloat(newProduct.commissionPercent || '0'),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation error',
          details: error.errors 
        });
      }
      fastify.log.error('Error creating product:', error);
      return reply.status(500).send({ error: 'Failed to create product' });
    }
  });

  // Update product
  fastify.put('/:id', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId;
      const validatedData = updateProductSchema.parse(request.body);

      // Check if product exists and belongs to tenant
      const existingProduct = await db.query.products.findFirst({
        where: eq(products.id, id),
      });

      if (!existingProduct || existingProduct.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      const updateData = {
        ...validatedData,
        price: validatedData.price?.toString(),
        commissionPercent: validatedData.commission_percent?.toString(),
      };

      const [updatedProduct] = await db
        .update(products)
        .set(updateData)
        .where(eq(products.id, id))
        .returning();

      // Convert string values to numbers for the frontend
      return {
        ...updatedProduct,
        price: parseFloat(updatedProduct.price || '0'),
        commission_percent: parseFloat(updatedProduct.commissionPercent || '0'),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ 
          error: 'Validation error',
          details: error.errors 
        });
      }
      fastify.log.error('Error updating product:', error);
      return reply.status(500).send({ error: 'Failed to update product' });
    }
  });

  // Delete product
  fastify.delete('/:id', async (request, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const { id } = request.params as { id: string };
      const tenantId = request.user.tenantId;

      // Check if product exists and belongs to tenant
      const existingProduct = await db.query.products.findFirst({
        where: eq(products.id, id),
      });

      if (!existingProduct || existingProduct.tenantId !== tenantId) {
        return reply.status(404).send({ error: 'Product not found' });
      }

      await db
        .delete(products)
        .where(eq(products.id, id));

      return { message: 'Product deleted successfully' };
    } catch (error) {
      fastify.log.error('Error deleting product:', error);
      return reply.status(500).send({ error: 'Failed to delete product' });
    }
  });
};

export default productRoutes; 