import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { apiLimiter } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, retryAfter } = apiLimiter(ip);
    if (!allowed) return NextResponse.json({ error: `Too many requests. Try again in ${retryAfter}s` }, { status: 429 });

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const transactions = await db.transaction.findMany({
      take: 100,
      include: { user: { select: { username: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const result = transactions.map((t) => ({
      id: t.id,
      userId: t.userId,
      username: t.user.username,
      amount: t.amount,
      type: t.type,
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Transactions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}