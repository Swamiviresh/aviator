import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { betLimiter } from '@/lib/rate-limit';
import { cancelBetSchema } from '@/lib/validate';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, retryAfter } = betLimiter(ip);
    if (!allowed) return NextResponse.json({ error: `Too many requests. Try again in ${retryAfter}s` }, { status: 429 });

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 403 });

    const body = await req.json();
    const parsed = cancelBetSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    // Refund logic - handled by game engine via Socket.IO
    return NextResponse.json({ message: 'Cancel bet handled via real-time socket' });
  } catch (error) {
    console.error('Cancel bet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}