# bistro-v3

Next.js 16 app-router project for the Bistro web experience.

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current Migration Status

### Onboarding slice (ported)

- New onboarding route: `/onboarding`
- Main route (`/`) now gates to onboarding until completion
- Onboarding completion returns users to `/` (temporary workspace destination)
- Migrated onboarding flow UI, state helpers, avatar assets, and animated background

### WXT → Next.js breaking changes captured in this slice

1. WXT multi-entry pages (`onboarding.html`, `bookmarks.html`) were replaced by Next routes.
2. Extension-only APIs (`browser.runtime.getURL`, `browser.tabs.create`, `webextension-polyfill`) are not used.
3. Onboarding uses explicit client boundaries (`"use client"`) for browser APIs (`window`, `localStorage`).
4. Storage behavior moved from extension-context assumptions to web-app local storage usage.
5. Vite `?raw` shader imports were replaced with TypeScript shader string modules for Turbopack compatibility.

### Replay onboarding in dev/test

- Default behavior remains once-only after completion.
- To replay onboarding in non-production environments, visit: `/onboarding/reset`
- The reset route clears onboarding local storage state and redirects to `/onboarding`.

## Next Slice

- Port the bookmarks/workspace experience and replace the temporary `/` placeholder destination with real app navigation.
