import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { authLimiter } from '@/lib/rate-limit';
import { registerSchema } from '@/lib/validate';

// Ensure admin exists
async function ensureAdmin() {
  const count = await db.user.count();
  if (count === 0) {
    await db.user.create({
      data: { username: 'admin', password: hashPassword('Admin@123'), balance: 0, role: 'admin' },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureAdmin();

    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, retryAfter } = authLimiter(ip);
    if (!allowed) return NextResponse.json({ error: `Too many attempts. Try again in ${retryAfter}s` }, { status: 429 });

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { username, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { username } });
    if (existing) return NextResponse.json({ error: 'Username already exists' }, { status: 409 });

    const user = await db.user.create({
      data: { username, password: hashPassword(password) },
      select: { id: true, username: true, balance: true, role: true },
    });

    const token = signToken({ id: user.id, username: user.username, role: user.role });

    return NextResponse.json({ token, user }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}