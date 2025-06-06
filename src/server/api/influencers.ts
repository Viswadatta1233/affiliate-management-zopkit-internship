import { db } from '@/server/db';
import { influencers, users, roles } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const influencerData = await db
      .select({
        id: influencers.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        roleName: roles.roleName,
        niche: influencers.niche,
        country: influencers.country,
        status: influencers.status,
        followers: influencers.metrics.followers,
        engagement: influencers.metrics.engagement,
      })
      .from(influencers)
      .innerJoin(users, eq(influencers.userId, users.id))
      .innerJoin(roles, eq(users.roleId, roles.id));

    return NextResponse.json(influencerData);
  } catch (error) {
    console.error('Error fetching influencers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch influencers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, niche, country, bio, status, metrics } = body;

    const newInfluencer = await db.insert(influencers).values({
      userId,
      niche,
      country,
      bio,
      status,
      metrics,
    }).returning();

    return NextResponse.json(newInfluencer[0]);
  } catch (error) {
    console.error('Error creating influencer:', error);
    return NextResponse.json(
      { error: 'Failed to create influencer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const updatedInfluencer = await db
      .update(influencers)
      .set(updateData)
      .where(eq(influencers.id, id))
      .returning();

    return NextResponse.json(updatedInfluencer[0]);
  } catch (error) {
    console.error('Error updating influencer:', error);
    return NextResponse.json(
      { error: 'Failed to update influencer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Influencer ID is required' },
        { status: 400 }
      );
    }

    await db.delete(influencers).where(eq(influencers.id, id));

    return NextResponse.json({ message: 'Influencer deleted successfully' });
  } catch (error) {
    console.error('Error deleting influencer:', error);
    return NextResponse.json(
      { error: 'Failed to delete influencer' },
      { status: 500 }
    );
  }
} 