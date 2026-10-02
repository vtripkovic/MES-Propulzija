# MES Propulzija

Next.js application for production, products, machines, sectors, and work orders.

## Local development

1. Configure `DATABASE_URL` for PostgreSQL in the local environment.
2. Install dependencies with `npm install`.
3. Apply database migrations and generate the Prisma client:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. Start the application:

   ```bash
   npm run dev
   ```

## User accounts and access

- Users register at `/register`. New accounts remain pending until an administrator approves the registration and assigns a sector.
- The first administrator is created once through `/setup`. Before starting the app, set `BOOTSTRAP_ADMIN_SECRET` to a private random value of at least 32 characters. The secret is checked only by the server, is not stored, and setup becomes unavailable after the first administrator exists.
- Sign in at `/login`. Sessions use random, hashed server-side tokens in an HttpOnly cookie and expire after seven days.
- Administrators have access to all sectors and can configure users, products, routings, BOMs, and machines.
- Regular users can view production and work orders related to their assigned sector and can start/complete operations using machines in that sector. They cannot manage global configuration.
- Administrators manage approvals, account activity, roles, and sector assignments at `/settings/users`.

For a fresh deployment, apply migrations before opening `/setup`. Keep `BOOTSTRAP_ADMIN_SECRET` out of source control and remove it from the deployment environment after the first administrator is created.
