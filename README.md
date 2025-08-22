# Authoria - Multi-Tenant Identity & Access Management System

A comprehensive IAM system built with .NET Core (ASP.NET Core Web API) and ReactJS, featuring multi-tenancy, role-based access control, audit logging, webhooks, and internationalization.

## Features

- **Users**: Registration, login, profile management, JWT authentication with refresh tokens, multi-tenant support
- **Roles**: CRUD operations, role hierarchy with permission inheritance
- **Permissions**: Fine-grained permissions with policy-based authorization
- **Languages**: Multi-language support with centralized i18n store
- **Layout Direction**: Full LTR/RTL support with auto-switching
- **Advanced Audit Logs**: Comprehensive event tracking with admin UI
- **Webhooks**: Event-driven communication with retry mechanisms and HMAC signing

## Quick Start

### Prerequisites

- .NET 8.0 SDK
- SQL Server (or use the provided connection string)
- Node.js 18+ (for frontend)

### Database Setup

The project is configured to use the following connection string:
```
Server=localhost;Database=Authoria;User ID=user;Password=password;Min Pool Size=50;TrustServerCertificate=True;
```

#### Option 1: Using PowerShell Script
```powershell
# Update database with migrations
.\src\Authoria.Infrastructure\update-database.ps1

# Or with custom connection string
.\src\Authoria.Infrastructure\update-database.ps1 -Connection "your_connection_string"
```

#### Option 2: Using EF Core CLI
```bash
# Add new migration
dotnet ef migrations add MigrationName -p src/Authoria.Infrastructure/Authoria.Infrastructure.csproj -s src/Authoria.API/Authoria.API.csproj

# Update database
dotnet ef database update -p src/Authoria.Infrastructure/Authoria.Infrastructure.csproj -s src/Authoria.API/Authoria.API.csproj
```

### Seed Database

The database is automatically seeded when the API starts up. The seeding process creates:
- Default tenant
- System roles (Admin, Manager, User)
- Basic permissions
- Admin user with full permissions

Default admin credentials:
- Email: `admin@example.com`
- Password: `TODO_HASH` (needs password hashing implementation)

If you need to manually seed the database, you can run the API once and the seeding will occur automatically.

### Run Backend

```bash
# Run the API
dotnet run --project src/Authoria.API/Authoria.API.csproj
```

API will be available at: `http://localhost:5000`
Swagger documentation: `http://localhost:5000/swagger`

### Run Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### Docker Deployment

```bash
# Build and run all services
docker-compose -f docker/docker-compose.yml up --build
```

## Project Structure

```
Authoria/
├── src/
│   ├── Authoria.API/           # Web API controllers and middleware
│   ├── Authoria.Application/   # Application services and DTOs
│   ├── Authoria.Domain/        # Domain entities and business logic
│   └── Authoria.Infrastructure/# Data access, external services, and database seeding
├── frontend/                   # ReactJS application
├── docker/                     # Docker configuration
└── README.md
```

## Configuration

### Connection Strings

The system uses the following connection string by default:
- **SQL Server**: `Server=localhost;Database=db;User ID=user;Password=pass;Min Pool Size=50;TrustServerCertificate=True;`

### Environment Variables

- `ConnectionStrings__SqlServer`: Override SQL Server connection string
- `ConnectionStrings__Redis`: Redis connection string (for caching)
- `Jwt__Secret`: JWT signing secret (change in production)

## API Documentation

Once the API is running, visit `http://localhost:5000/swagger` for interactive API documentation including:
- Authentication flows
- Request/response examples
- Webhook payload schemas
- Authorization requirements

## Development

### Adding New Migrations

```bash
dotnet ef migrations add MigrationName -p src/Authoria.Infrastructure/Authoria.Infrastructure.csproj -s src/Authoria.API/Authoria.API.csproj
```

### Running Tests

```bash
# Backend tests
dotnet test

# Frontend tests
cd frontend && npm test
```

## Security

- JWT authentication with refresh tokens
- Role-based and permission-based authorization
- HMAC-SHA256 webhook signatures
- Input validation and sanitization
- Rate limiting
- Audit logging for all operations

## License

This project is licensed under the MIT License.
