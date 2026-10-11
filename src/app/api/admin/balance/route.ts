import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { apiLimiter } from '@/lib/rate-limit';
import { z } from 'zod';

const balanceBodySchema = z.object({
  userId: z.number().int().positive(),
  amount: z.number().positive('Amount must be positive').max(1000000, 'Amount too large'),
  action: z.enum(['add', 'deduct']),
});

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const parsed = balanceBodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { userId, amount, action } = parsed.data;
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const changeAmount = action === 'add' ? amount : -amount;
    const newBalance = user.balance + changeAmount;
    if (newBalance < 0) return NextResponse.json({ error: 'Insufficient balance for deduction' }, { status: 400 });

    await db.user.update({ where: { id: userId }, data: { balance: newBalance } });

    await db.transaction.create({
      data: {
        userId,
        amount,
        type: action === 'add' ? 'credit' : 'debit',
        description: `Admin ${action === 'add' ? 'added' : 'deducted'} balance`,
      },
    });

    return NextResponse.json({ userId, newBalance });
  } catch (error) {
    console.error('Admin balance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}