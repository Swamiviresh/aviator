import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'aviator-secret-key-change-in-production-2024';

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: { id: number; username: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): { id: number; username: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string };
  } catch {
    return null;
  }
}

export { JWT_SECRET };