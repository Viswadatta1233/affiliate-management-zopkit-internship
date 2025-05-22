import { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { products } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Product validation schema
const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional(),
  price: z.number().positive('Price must be positive'),
  currency: z.string().length(3, 'Currency must be a 3-letter code'),
  category: z.string().optional(),
  status: z.enum(['available', 'unavailable', 'outofstock']),
});

type ProductBody = z.infer<typeof productSchema>;

export const productRoutes = async (server: FastifyInstance) => {
  // Get all products for a tenant
  server.get('/', async (request: FastifyRequest, reply) => {
    try {
      // Get tenant ID from authenticated user
      if (!request.user || !request.user.tenantId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const tenantId = request.user.tenantId;
      
      const productList = await db.query.products.findMany({
        where: eq(products.tenantId, tenantId),
        orderBy: [products.createdAt],
      });
      
      return { products: productList };
    } catch (error) {
      console.error('Error fetching products:', error);
      return reply.code(500).send({ error: 'Failed to fetch products' });
    }
  });
  
  // Get product by ID
  server.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    try {
      const { id } = request.params;
      
      // Get tenant ID from authenticated user
      if (!request.user || !request.user.tenantId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const tenantId = request.user.tenantId;
      
      const product = await db.query.products.findFirst({
        where: and(
          eq(products.id, id),
          eq(products.tenantId, tenantId)
        ),
      });
      
      if (!product) {
        return reply.code(404).send({ error: 'Product not found' });
      }
      
      return { product };
    } catch (error) {
      console.error('Error fetching product:', error);
      return reply.code(500).send({ error: 'Failed to fetch product' });
    }
  });
  
  // Create new product
  server.post('/', async (request: FastifyRequest<{ Body: ProductBody }>, reply) => {
    try {
      const body = productSchema.parse(request.body);
      
      // Get tenant ID from authenticated user
      if (!request.user || !request.user.tenantId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const tenantId = request.user.tenantId;
      
      const [product] = await db.insert(products).values({
        ...body,
        tenantId,
      }).returning();
      
      return { product };
    } catch (error) {
      console.error('Error creating product:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ error: 'Failed to create product' });
    }
  });
  
  // Update product
  server.put('/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: ProductBody }>, reply) => {
    try {
      const { id } = request.params;
      const body = productSchema.parse(request.body);
      
      // Get tenant ID from authenticated user
      if (!request.user || !request.user.tenantId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const tenantId = request.user.tenantId;
      
      // Check if product exists and belongs to tenant
      const existingProduct = await db.query.products.findFirst({
        where: and(
          eq(products.id, id),
          eq(products.tenantId, tenantId)
        ),
      });
      
      if (!existingProduct) {
        return reply.code(404).send({ error: 'Product not found' });
      }
      
      const [updatedProduct] = await db.update(products)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(and(
          eq(products.id, id),
          eq(products.tenantId, tenantId)
        ))
        .returning();
      
      return { product: updatedProduct };
    } catch (error) {
      console.error('Error updating product:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      return reply.code(500).send({ error: 'Failed to update product' });
    }
  });
  
  // Delete product
  server.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    try {
      const { id } = request.params;
      
      // Get tenant ID from authenticated user
      if (!request.user || !request.user.tenantId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }
      
      const tenantId = request.user.tenantId;
      
      // Check if product exists and belongs to tenant
      const existingProduct = await db.query.products.findFirst({
        where: and(
          eq(products.id, id),
          eq(products.tenantId, tenantId)
        ),
      });
      
      if (!existingProduct) {
        return reply.code(404).send({ error: 'Product not found' });
      }
      
      await db.delete(products)
        .where(and(
          eq(products.id, id),
          eq(products.tenantId, tenantId)
        ));
      
      return { success: true, message: 'Product deleted successfully' };
    } catch (error) {
      console.error('Error deleting product:', error);
      return reply.code(500).send({ error: 'Failed to delete product' });
    }
  });
}; 