import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signupSchema } from '@/lib/schemas/auth';
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMIT_CONFIG } from '@/lib/rate-limit';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, reset } = await checkRateLimit('signup', ip, RATE_LIMIT_CONFIG.signup);
  if (!success) return rateLimitResponse(reset);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { name: rawName, email: rawEmail, password } = parsed.data;
  const name = rawName.trim();
  const email = rawEmail.toLowerCase().trim();

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists', code: 'EMAIL_TAKEN' },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: { name, email, passwordHash, role: 'PLAYER' },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  // Awaited (not fire-and-forget): on serverless, the function instance can
  // be frozen the moment the response is returned, killing any unawaited
  // promise mid-flight. sendWelcomeEmail catches its own errors internally,
  // so awaiting it can't turn a failed email into a failed signup.
  await sendWelcomeEmail({ to: user.email, name: user.name });

  return NextResponse.json({ user }, { status: 201 });
}
