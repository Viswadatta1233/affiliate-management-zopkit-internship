import { db } from './index';
import { roles, tenants } from './schema';
import { eq } from 'drizzle-orm';

export async function seedRoles() {
  try {
    // First, create a default tenant if it doesn't exist
    const defaultTenant = await db.query.tenants.findFirst({
      where: eq(tenants.tenantName, 'Default Tenant'),
    });

    let tenantId;
    if (!defaultTenant) {
      const [newTenant] = await db.insert(tenants).values({
        tenantName: 'Default Tenant',
        domain: 'localhost',
        subdomain: 'default',
        status: 'active',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      }).returning();
      tenantId = newTenant.id;
      console.log('Created default tenant');
    } else {
      tenantId = defaultTenant.id;
      console.log('Using existing default tenant');
    }

    // Check if potential_influencer role exists
    const existingRole = await db.query.roles.findFirst({
      where: eq(roles.roleName, 'potential_influencer'),
    });

    if (!existingRole) {
      // Insert potential_influencer role
      await db.insert(roles).values({
        tenantId,
        roleName: 'potential_influencer',
        description: 'User who has registered as an influencer but is pending approval',
        isCustom: false,
      });
      console.log('Created potential_influencer role');
    } else {
      console.log('potential_influencer role already exists');
    }
  } catch (error) {
    console.error('Error seeding roles:', error);
    throw error;
  }
}

// Run the seed function
seedRoles()
  .then(() => {
    console.log('Roles seeded successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }); 