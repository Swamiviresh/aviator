import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/validate';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 403 });

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    await db.user.update({
      where: { id: decoded.id },
      data: { password: hashPassword(parsed.data.newPassword) },
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}