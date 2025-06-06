import { db } from '@/server/db';
import { users, roles, influencers } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { hashPassword } from '@/server/utils/auth';

export async function POST(request: Request) {
  // Handle CORS preflight request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const body = await request.json();
    const {
      fullName,
      email,
      password,
      phone,
      social_links,
      niche,
      country,
      bio,
      role,
    } = body;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Get the potential_influencer role
    const [influencerRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.roleName, 'potential_influencer'))
      .limit(1);

    if (!influencerRole) {
      return NextResponse.json(
        { error: 'Influencer role not found' },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          },
        }
      );
    }

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').slice(1).join(' '),
        phone,
        roleId: influencerRole.id,
        termsAccepted: true,
      })
      .returning();

    // Create influencer profile
    const [newInfluencer] = await db
      .insert(influencers)
      .values({
        userId: newUser.id,
        niche,
        country,
        bio,
        status: 'pending',
        socialMedia: social_links,
        metrics: {
          followers: 0,
          engagement: 0,
          reach: 0,
          total_campaigns: 0,
          total_earnings: 0,
        },
      })
      .returning();

    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
        influencer: {
          id: newInfluencer.id,
          niche: newInfluencer.niche,
          country: newInfluencer.country,
          status: newInfluencer.status,
        },
      },
      {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Error registering influencer:', error);
    return NextResponse.json(
      { error: 'Failed to register influencer' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
} 