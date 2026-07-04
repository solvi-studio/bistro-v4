import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'site_unlocked'

function getSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return new TextEncoder().encode(secret)
}

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/unlock',
  '/unlock(.*)',
])

const isPasswordExempt = createRouteMatcher([
  '/unlock',
  '/unlock(.*)',
  '/__clerk(.*)',
])

const clerkHandler = clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect()
    }
  },
  {
    frontendApiProxy: {
      enabled: process.env.NEXT_PUBLIC_ENABLE_CLERK_PROXY === 'true',
    },
  }
)

export default async function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const sitePassword = process.env.SITE_ACCESS_PASSWORD

  if (sitePassword && !isPasswordExempt(request)) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    let isUnlocked = false

    if (token) {
      try {
        const { payload } = await jwtVerify(token, getSecret())
        isUnlocked = payload.unlocked === true
      } catch {
        // Tampered or expired JWT — treat as locked
      }
    }

    if (!isUnlocked) {
      const url = new URL('/unlock', request.url)
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  return clerkHandler(request, event)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}