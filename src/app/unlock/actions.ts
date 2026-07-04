'use server'

import { timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT } from 'jose'

const COOKIE_NAME = 'site_unlocked'

function getSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function unlockSite(_prevState: unknown, formData: FormData) {
  const password = (formData.get('password') as string) ?? ''

  // 1. Constant-time comparison to prevent timing attacks
  const expected = process.env.SITE_ACCESS_PASSWORD ?? ''
  const a = Buffer.from(password)
  const b = Buffer.from(expected)
  const match = a.length === b.length && timingSafeEqual(a, b)

  if (!match) {
    return { error: 'Incorrect password' }
  }

  // 2. Sign a JWT so the cookie value can't be forged
  const token = await new SignJWT({ unlocked: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })

  // 3. Validate redirect to prevent open redirect attacks
  const raw = (formData.get('redirect') as string) ?? ''
  const redirectTo = raw.startsWith('/') ? raw : '/'

  redirect(redirectTo)
}