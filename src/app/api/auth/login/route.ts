import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';
import { authLimiter } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validate';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, retryAfter } = authLimiter(ip);
    if (!allowed) return NextResponse.json({ error: `Too many attempts. Try again in ${retryAfter}s` }, { status: 429 });

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { username, password } = parsed.data;

    const user = await db.user.findUnique({ where: { username } });
    if (!user || !comparePassword(password, user.password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ id: user.id, username: user.username, role: user.role });

    return NextResponse.json({
      token,
      user: { id: user.id, username: user.username, balance: user.balance, role: user.role },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}