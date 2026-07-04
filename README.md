# bistro-v4

Next.js 16 app-router project for the Bistro web experience.

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Current Migration Status (THIS NEEDS TO BE AUDITED AND CLEAN UP)

### Onboarding slice (ported)

- New onboarding route: `/onboarding`
- Main route (`/`) now gates to onboarding until completion
- Onboarding completion returns users to `/` (temporary workspace destination)
- Migrated onboarding flow UI, state helpers, avatar assets, and animated background

### Replay onboarding in dev/test

- Default behavior remains once-only after completion.
- To replay onboarding in non-production environments, visit: `/onboarding/reset`
- The reset route clears onboarding local storage state and redirects to `/onboarding`.

### Next Slice

- Port the bookmarks/workspace experience and replace the temporary `/` placeholder destination with real app navigation.

## Interact with database

1. Modify your schema in `src/lib/db/schema`
2. Run `pnpm db:generate` to gen SQL file
3. Run `pnpm db:migrate` to apply migration

DO NOT use `drizzle-kit push`

Drizzle-kit is notorious for not producing logs if it s command fail, if so, you can test with spinning up local Postgres

1. Write `docker-compose.yaml`
2. Run the service
3. Interact with the local db using Drizzle to see logs
