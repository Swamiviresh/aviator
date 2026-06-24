import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Password must contain both letters and numbers'),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const betSchema = z.object({
  amount: z.number()
    .positive('Bet amount must be positive')
    .min(10, 'Minimum bet is 10')
    .max(100000, 'Maximum bet is 100,000'),
  slotId: z.number().int().min(1).max(2).default(1),
});

export const cashoutSchema = z.object({
  slotId: z.number().int().min(1).max(2).default(1),
});

export const cancelBetSchema = z.object({
  slotId: z.number().int().min(1).max(2).default(1),
});

export const changePasswordSchema = z.object({
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Password must contain both letters and numbers'),
});

export const adminBalanceSchema = z.object({
  userId: z.number().int().positive(),
  amount: z.number().positive('Amount must be positive').max(1000000, 'Amount too large'),
});

export const gameControlSchema = z.object({
  action: z.enum(['start', 'stop', 'crash']),
});