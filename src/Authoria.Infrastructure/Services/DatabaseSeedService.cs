using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Authoria.Infrastructure.Services.Security;

namespace Authoria.Infrastructure.Services;

public interface IDatabaseSeedService
{
    Task SeedAsync();
}

public class DatabaseSeedService : IDatabaseSeedService
{
    private readonly AuthoriaDbContext _context;
    private readonly ILogger<DatabaseSeedService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasher _passwordHasher;

    public DatabaseSeedService(AuthoriaDbContext context, ILogger<DatabaseSeedService> logger, IConfiguration configuration, IPasswordHasher passwordHasher)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
    }

    public async Task SeedAsync()
    {
        _logger.LogInformation("Starting database seeding...");

        try
        {
            // Test database connection first
            if (!await TestDatabaseConnectionAsync())
            {
                _logger.LogWarning("Database connection failed. Skipping seeding.");
                return;
            }

            await _context.Database.MigrateAsync();

            // Seed tenants
            await SeedTenantsAsync();

            // Seed permissions
            await SeedPermissionsAsync();

            // Seed roles
            await SeedRolesAsync();

            // Assign permissions to roles
            await AssignPermissionsToRolesAsync();

            // Seed admin user
            await SeedAdminUserAsync();

            // Assign roles and tenant to admin user
            await AssignUserRolesAndTenantsAsync();

            _logger.LogInformation("Database seeding completed successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during database seeding");
            // Don't throw the exception to prevent the application from crashing
            // Just log it and continue
        }
    }

    private async Task<bool> TestDatabaseConnectionAsync()
    {
        try
        {
            _logger.LogInformation("Testing database connection...");
            
            // Check multiple sources for connection string
            var connectionString = _configuration.GetConnectionString("SqlServer");
            var envConnectionString = Environment.GetEnvironmentVariable("ConnectionStrings__SqlServer");
            var envConnectionStringAlt = Environment.GetEnvironmentVariable("ConnectionStrings:SqlServer");
            
            _logger.LogInformation("Connection string from configuration: {ConnectionString}", connectionString);
            _logger.LogInformation("Connection string from environment (double underscore): {EnvConnectionString}", envConnectionString ?? "Not set");
            _logger.LogInformation("Connection string from environment (colon): {EnvConnectionStringAlt}", envConnectionStringAlt ?? "Not set");
            
            // Check if there are any other environment variables that might be affecting this
            var allEnvVars = Environment.GetEnvironmentVariables();
            var connectionVars = new List<string>();
            foreach (var key in allEnvVars.Keys)
            {
                var keyStr = key.ToString();
                if (keyStr.Contains("Connection") || keyStr.Contains("SQL") || keyStr.Contains("Authoria"))
                {
                    connectionVars.Add($"{keyStr}={allEnvVars[key]}");
                }
            }
            _logger.LogInformation("All connection-related environment variables: {ConnectionVars}", string.Join(", ", connectionVars));
            
            // Let's also check what's in the configuration directly
            var configSection = _configuration.GetSection("ConnectionStrings");
            _logger.LogInformation("Configuration section 'ConnectionStrings' exists: {Exists}", configSection.Exists());
            if (configSection.Exists())
            {
                foreach (var child in configSection.GetChildren())
                {
                    _logger.LogInformation("Config key: {Key}, Value: {Value}", child.Key, child.Value);
                }
            }
            
            // Use environment variable if available, otherwise use configuration
            var finalConnectionString = envConnectionString ?? connectionString;
            _logger.LogInformation("Final connection string being used: {FinalConnectionString}", finalConnectionString);
            
            await _context.Database.CanConnectAsync();
            _logger.LogInformation("Database connection successful.");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database connection failed. Please ensure SQL Server is running and the connection string is correct.");
            return false;
        }
    }

    private async Task SeedTenantsAsync()
    {
        var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        if (!await _context.Tenants.AnyAsync(t => t.Id == defaultTenantId))
        {
            _context.Tenants.Add(new Tenant { Id = defaultTenantId, Name = "Default" });
            await _context.SaveChangesAsync();
            _logger.LogInformation("Default tenant seeded");
        }
    }

    private async Task SeedPermissionsAsync()
    {
        string[] permissions = new[]
        {
            // User Management
            "user.view", "user.create", "user.update", "user.delete",
            
            // Role Management
            "role.view", "role.create", "role.update", "role.delete", "role.assign",
            
            // Permission Management
            "permission.view", "permission.create", "permission.update", "permission.delete", "permission.assign",
            
            // System Management
            "system.view", "system.configure", "system.admin",
            
            // Localization
            "localization.view", "localization.create", "localization.update", "localization.delete",
            
            // Audit
            "audit.view", "audit.export",
            
            // Webhooks
            "webhook.view", "webhook.create", "webhook.update", "webhook.delete",
            
            // Tenant Management
            "tenant.view", "tenant.create", "tenant.update", "tenant.delete",
            
            // Dashboard
            "dashboard.view", "dashboard.admin",
            
            // Reports
            "report.view", "report.create", "report.export"
        };

        foreach (var permissionName in permissions)
        {
            if (!await _context.Permissions.AnyAsync(x => x.Name == permissionName))
            {
                _context.Permissions.Add(new Permission { Id = Guid.NewGuid(), Name = permissionName });
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Permissions seeded");
    }

    private async Task SeedRolesAsync()
    {
        var adminRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        if (!await _context.Roles.AnyAsync(r => r.Id == adminRoleId))
        {
            _context.Roles.Add(new Role { Id = adminRoleId, Name = "Admin", Description = "System administrator with full access" });
        }

        var managerRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        if (!await _context.Roles.AnyAsync(r => r.Id == managerRoleId))
        {
            _context.Roles.Add(new Role { Id = managerRoleId, Name = "Manager", Description = "Team manager with user and role management access" });
        }

        var userRoleId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        if (!await _context.Roles.AnyAsync(r => r.Id == userRoleId))
        {
            _context.Roles.Add(new Role { Id = userRoleId, Name = "User", Description = "Standard user with basic access" });
        }

        var auditorRoleId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        if (!await _context.Roles.AnyAsync(r => r.Id == auditorRoleId))
        {
            _context.Roles.Add(new Role { Id = auditorRoleId, Name = "Auditor", Description = "Audit and reporting access" });
        }

        var developerRoleId = Guid.Parse("77777777-7777-7777-7777-777777777777");
        if (!await _context.Roles.AnyAsync(r => r.Id == developerRoleId))
        {
            _context.Roles.Add(new Role { Id = developerRoleId, Name = "Developer", Description = "Developer with webhook and system configuration access" });
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Roles seeded");
    }

    private async Task AssignPermissionsToRolesAsync()
    {
        var adminRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var managerRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var userRoleId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var auditorRoleId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        var developerRoleId = Guid.Parse("77777777-7777-7777-7777-777777777777");

        // Get all permissions
        var allPermissions = await _context.Permissions.ToListAsync();

        // Admin gets all permissions
        foreach (var permission in allPermissions)
        {
            if (!await _context.RolePermissions.AnyAsync(rp => rp.RoleId == adminRoleId && rp.PermissionId == permission.Id))
            {
                _context.RolePermissions.Add(new RolePermission { RoleId = adminRoleId, PermissionId = permission.Id });
            }
        }

        // Manager gets user and role management permissions
        var managerPermissions = allPermissions.Where(p => 
            p.Name.StartsWith("user.") || 
            p.Name.StartsWith("role.") || 
            p.Name == "dashboard.view" ||
            p.Name == "report.view"
        ).ToList();

        foreach (var permission in managerPermissions)
        {
            if (!await _context.RolePermissions.AnyAsync(rp => rp.RoleId == managerRoleId && rp.PermissionId == permission.Id))
            {
                _context.RolePermissions.Add(new RolePermission { RoleId = managerRoleId, PermissionId = permission.Id });
            }
        }

        // User gets basic view permissions
        var userPermissions = allPermissions.Where(p => 
            p.Name == "user.view" || 
            p.Name == "dashboard.view"
        ).ToList();

        foreach (var permission in userPermissions)
        {
            if (!await _context.RolePermissions.AnyAsync(rp => rp.RoleId == userRoleId && rp.PermissionId == permission.Id))
            {
                _context.RolePermissions.Add(new RolePermission { RoleId = userRoleId, PermissionId = permission.Id });
            }
        }

        // Auditor gets audit and reporting permissions
        var auditorPermissions = allPermissions.Where(p => 
            p.Name.StartsWith("audit.") || 
            p.Name.StartsWith("report.") ||
            p.Name == "dashboard.view"
        ).ToList();

        foreach (var permission in auditorPermissions)
        {
            if (!await _context.RolePermissions.AnyAsync(rp => rp.RoleId == auditorRoleId && rp.PermissionId == permission.Id))
            {
                _context.RolePermissions.Add(new RolePermission { RoleId = auditorRoleId, PermissionId = permission.Id });
            }
        }

        // Developer gets webhook and system permissions
        var developerPermissions = allPermissions.Where(p => 
            p.Name.StartsWith("webhook.") || 
            p.Name.StartsWith("system.") ||
            p.Name == "dashboard.view"
        ).ToList();

        foreach (var permission in developerPermissions)
        {
            if (!await _context.RolePermissions.AnyAsync(rp => rp.RoleId == developerRoleId && rp.PermissionId == permission.Id))
            {
                _context.RolePermissions.Add(new RolePermission { RoleId = developerRoleId, PermissionId = permission.Id });
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Permissions assigned to all roles");
    }

    private async Task SeedAdminUserAsync()
    {
        var adminUserId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        if (!await _context.Users.AnyAsync(u => u.Id == adminUserId))
        {
            var adminPassword = "Admin123!"; // Default admin password
            var hashedPassword = _passwordHasher.HashPassword(adminPassword);
            
            _context.Users.Add(new User
            {
                Id = adminUserId,
                Email = "admin@example.com",
                PasswordHash = hashedPassword,
                FirstName = "Admin",
                LastName = "User",
                Status = UserStatus.Active
            });

            await _context.SaveChangesAsync();
            _logger.LogInformation("Admin user seeded with password: {Password}", adminPassword);
        }
    }

    private async Task AssignUserRolesAndTenantsAsync()
    {
        var adminUserId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        // Get all roles to assign to admin user
        var allRoles = await _context.Roles.ToListAsync();

        foreach (var role in allRoles)
        {
            if (!await _context.UserRoles.AnyAsync(ur => ur.UserId == adminUserId && ur.RoleId == role.Id))
            {
                _context.UserRoles.Add(new UserRole { UserId = adminUserId, RoleId = role.Id });
                _logger.LogInformation("Assigned role '{RoleName}' to admin user", role.Name);
            }
        }

        if (!await _context.UserTenants.AnyAsync(ut => ut.UserId == adminUserId && ut.TenantId == defaultTenantId))
        {
            _context.UserTenants.Add(new UserTenant { UserId = adminUserId, TenantId = defaultTenantId });
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Admin user assigned to all roles and default tenant");
    }
}
