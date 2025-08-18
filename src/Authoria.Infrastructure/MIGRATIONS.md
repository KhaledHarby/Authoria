# Entity Framework Core Migrations

This project uses EF Core for SQL Server. Migrations live under `Persistence/Migrations` in `Authoria.Infrastructure`.

## Prerequisites
- .NET SDK (8/9)
- EF CLI: `dotnet tool update -g dotnet-ef`
- SQL Server running and reachable. Set the connection string in `src/Authoria.API/appsettings.json` or via env var `ConnectionStrings__SqlServer`.

Default connection string (dev):
Server=localhost;Database=Authoria;Trusted_Connection=True;TrustServerCertificate=True

If using docker-compose, start it first:
`docker compose up -d sqlserver`

## Add a new migration
From the repo root:
`dotnet ef migrations add <Name> -p src/Authoria.Infrastructure/Authoria.Infrastructure.csproj -s src/Authoria.API/Authoria.API.csproj -o Persistence/Migrations`

Example:
`dotnet ef migrations add AddWebhookIndexes -p src/Authoria.Infrastructure/Authoria.Infrastructure.csproj -s src/Authoria.API/Authoria.API.csproj -o Persistence/Migrations`

Or use the helper script (PowerShell):
`./src/Authoria.Infrastructure/add-migration.ps1 AddWebhookIndexes`

## Update the database
`dotnet ef database update -p src/Authoria.Infrastructure/Authoria.Infrastructure.csproj -s src/Authoria.API/Authoria.API.csproj`

Or use the helper script:
`./src/Authoria.Infrastructure/update-database.ps1`

To target a specific migration:
`./src/Authoria.Infrastructure/update-database.ps1 20250818111000_AddWebhookIndexes`

## Remove the last migration (if not applied)
`dotnet ef migrations remove -p src/Authoria.Infrastructure/Authoria.Infrastructure.csproj -s src/Authoria.API/Authoria.API.csproj`

## Generate SQL script (optional)
`dotnet ef migrations script -p src/Authoria.Infrastructure/Authoria.Infrastructure.csproj -s src/Authoria.API/Authoria.API.csproj -o src/Authoria.Infrastructure/Persistence/Migrations/latest.sql`

## Notes
- Startup project is `Authoria.API` (for configuration/DI).
- If the CLI can’t connect, verify SQL Server is running and the connection string is correct.
