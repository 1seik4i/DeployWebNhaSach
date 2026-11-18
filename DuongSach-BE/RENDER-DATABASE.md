# Render: Prisma P1001 on startup

P1001 means Prisma cannot reach the configured PostgreSQL server. Retrying
can handle temporary database startup delays, but cannot repair a stale URL,
an unavailable database, or a private network region mismatch.

1. Open the PostgreSQL instance in Render and confirm its status is Available.
2. Compare its region and workspace with the backend service. The Internal
   Database URL only works within the same region and workspace.
3. In backend > Environment, set DATABASE_URL to the database's current
   Internal Database URL when both services share that private network.
   Copy the full URL, including username, password and database name.
4. If they are in different regions/workspaces, use the External Database URL,
   require TLS with `sslmode=require` (use `&` if the URL already has a query),
   and check the database's external access rules. Alternatively create a
   backend service in the database's region.
5. Save the environment changes and redeploy the backend.

Both checked-in render.yaml files use Singapore for the backend and database
and reference the database connection string through fromDatabase. Services
created manually must have their dashboard settings checked separately.

Startup now waits for a database connection (up to 10 attempts, 5 seconds
between attempts, plus connection timeout) before running `prisma db push`.
Authentication and other non-connectivity errors fail immediately.
Do not paste the full database URL into logs or support messages.

Reference: https://render.com/docs/postgresql-creating-connecting
