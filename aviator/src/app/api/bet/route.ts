import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { betLimiter } from '@/lib/rate-limit';
import { betSchema } from '@/lib/validate';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, retryAfter } = betLimiter(ip);
    if (!allowed) return NextResponse.json({ error: `Too many bets. Try again in ${retryAfter}s` }, { status: 429 });

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 403 });

    const body = await req.json();
    const parsed = betSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const { amount, slotId } = parsed.data;
    const userId = decoded.id;

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.balance < amount) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

    // Deduct balance
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });

    // Create transaction
    await db.transaction.create({
      data: { userId, amount, type: 'bet', description: `Placed bet in slot ${slotId}` },
    });

    return NextResponse.json({
      userId,
      username: decoded.username,
      amount,
      multiplier: 0,
      status: 'pending',
      slotId,
      balance: updatedUser.balance,
    });
  } catch (error) {
    console.error('Bet error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}