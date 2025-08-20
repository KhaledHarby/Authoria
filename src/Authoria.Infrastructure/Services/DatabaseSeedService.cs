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
        _logger.LogInformation("Seeding started");

        try
        {
            if (!await TestDatabaseConnectionAsync())
            {
                _logger.LogWarning("Skipping seeding due to connection failure");
                return;
            }

            // Assume migrations are applied externally to avoid long startup
            // await _context.Database.MigrateAsync();

            await SeedTenantsAsync();
            await SeedPermissionsAsync();
            await SeedRolesAsync();
            await AssignPermissionsToRolesAsync();
            await SeedAdminUserAsync();
            await AssignUserRolesAndTenantsAsync();
            await SeedApplicationsAsync();
            await SeedTestUsersAsync();
            await SeedLocalizationLabelsAsync();

            _logger.LogInformation("Seeding completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during seeding");
        }
    }

    private async Task<bool> TestDatabaseConnectionAsync()
    {
        try
        {
            var conn = _configuration.GetConnectionString("SqlServer");
            _logger.LogInformation("Testing DB connection to configured SQL Server");
            await _context.Database.CanConnectAsync();
            _logger.LogInformation("DB connection OK");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DB connection failed");
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
            "user.permissions.view", "user.permissions.assign", "user.permissions.remove",
            
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

        // Link admin user to all applications
        var applicationIds = new[]
        {
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), // Main Application
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), // Admin Portal
            Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")  // Mobile App
        };

        foreach (var appId in applicationIds)
        {
            if (!await _context.UserApplications.AnyAsync(ua => ua.UserId == adminUserId && ua.ApplicationId == appId))
            {
                _context.UserApplications.Add(new UserApplication 
                { 
                    UserId = adminUserId, 
                    ApplicationId = appId, 
                    IsActive = true 
                });
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Admin user assigned to all roles, default tenant, and all applications");
    }

    private async Task SeedApplicationsAsync()
    {
        var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        
        var applications = new[]
        {
            new Authoria.Domain.Entities.Application 
            { 
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                TenantId = defaultTenantId, 
                Name = "Main Application", 
                Description = "Primary business application",
                CreatedAtUtc = DateTime.UtcNow
            },
            new Authoria.Domain.Entities.Application 
            { 
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                TenantId = defaultTenantId, 
                Name = "Admin Portal", 
                Description = "Administrative interface",
                CreatedAtUtc = DateTime.UtcNow
            },
            new Authoria.Domain.Entities.Application 
            { 
                Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                TenantId = defaultTenantId, 
                Name = "Mobile App", 
                Description = "Mobile application backend",
                CreatedAtUtc = DateTime.UtcNow
            }
        };

        foreach (var app in applications)
        {
            if (!await _context.Applications.AnyAsync(a => a.Id == app.Id))
            {
                _context.Applications.Add(app);
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Applications seeded");
    }

    private async Task SeedTestUsersAsync()
    {
        var defaultTenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var userRoleId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var passwordHash = _passwordHasher.HashPassword("Admin123!");

        // Ensure we have at least 100 users
        var existingCount = await _context.Users.CountAsync();
        var toSeed = Math.Max(0, 100 - existingCount);
        if (toSeed <= 0)
        {
            _logger.LogInformation("Skipping test users seeding: existing users = {Count}", existingCount);
            return;
        }

        var firstNames = new[] { "John", "Jane", "Michael", "Emily", "David", "Sarah", "Robert", "Olivia", "Daniel", "Emma", "Liam", "Sophia", "Noah", "Isabella", "James", "Mia", "Benjamin", "Charlotte", "Lucas", "Amelia" };
        var lastNames = new[] { "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin" };

        // Get application IDs for linking users
        var applicationIds = new[]
        {
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), // Main Application
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), // Admin Portal
            Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")  // Mobile App
        };

        var toCreate = new List<User>();
        var toCreateUserTenants = new List<UserTenant>();
        var toCreateUserRoles = new List<UserRole>();
        var toCreateUserApplications = new List<UserApplication>();

        int idx = existingCount + 1;
        for (int i = 0; i < toSeed; i++)
        {
            var fn = firstNames[i % firstNames.Length];
            var ln = lastNames[(i / firstNames.Length + i) % lastNames.Length];
            var email = $"{fn.ToLower()}.{ln.ToLower()}{idx}@example.com";
            idx++;

            if (await _context.Users.AnyAsync(u => u.Email == email)) continue;

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = passwordHash,
                FirstName = fn,
                LastName = ln,
                Status = UserStatus.Active,
                LastLoginAtUtc = null
            };
            toCreate.Add(user);
            toCreateUserTenants.Add(new UserTenant { UserId = user.Id, TenantId = defaultTenantId });
            toCreateUserRoles.Add(new UserRole { UserId = user.Id, RoleId = userRoleId });

            // Link users to applications randomly (each user gets 1-3 applications)
            var appCount = new Random().Next(1, 4); // 1 to 3 applications
            var selectedApps = applicationIds.OrderBy(x => Guid.NewGuid()).Take(appCount);
            foreach (var appId in selectedApps)
            {
                toCreateUserApplications.Add(new UserApplication 
                { 
                    UserId = user.Id, 
                    ApplicationId = appId, 
                    IsActive = true 
                });
            }
        }

        if (toCreate.Count > 0)
        {
            await _context.Users.AddRangeAsync(toCreate);
            await _context.SaveChangesAsync();
            await _context.UserTenants.AddRangeAsync(toCreateUserTenants);
            await _context.UserRoles.AddRangeAsync(toCreateUserRoles);
            await _context.UserApplications.AddRangeAsync(toCreateUserApplications);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Seeded {Count} test users with application links", toCreate.Count);
        }
    }

    private async Task SeedLocalizationLabelsAsync()
    {
        _logger.LogInformation("Seeding localization labels...");

        var labels = new List<LocalizationLabel>
        {
            // Common labels
            new() { Key = "common.loading", Language = "en", Value = "Loading..." },
            new() { Key = "common.loading", Language = "ar", Value = "جاري التحميل..." },
            new() { Key = "common.error", Language = "en", Value = "Error" },
            new() { Key = "common.error", Language = "ar", Value = "خطأ" },
            new() { Key = "common.success", Language = "en", Value = "Success" },
            new() { Key = "common.success", Language = "ar", Value = "نجح" },
            new() { Key = "common.save", Language = "en", Value = "Save" },
            new() { Key = "common.save", Language = "ar", Value = "حفظ" },
            new() { Key = "common.cancel", Language = "en", Value = "Cancel" },
            new() { Key = "common.cancel", Language = "ar", Value = "إلغاء" },
            new() { Key = "common.delete", Language = "en", Value = "Delete" },
            new() { Key = "common.delete", Language = "ar", Value = "حذف" },
            new() { Key = "common.edit", Language = "en", Value = "Edit" },
            new() { Key = "common.edit", Language = "ar", Value = "تعديل" },
            new() { Key = "common.create", Language = "en", Value = "Create" },
            new() { Key = "common.create", Language = "ar", Value = "إنشاء" },
            new() { Key = "common.search", Language = "en", Value = "Search" },
            new() { Key = "common.search", Language = "ar", Value = "بحث" },
            new() { Key = "common.filter", Language = "en", Value = "Filter" },
            new() { Key = "common.filter", Language = "ar", Value = "تصفية" },
            new() { Key = "common.refresh", Language = "en", Value = "Refresh" },
            new() { Key = "common.refresh", Language = "ar", Value = "تحديث" },
            new() { Key = "common.export", Language = "en", Value = "Export" },
            new() { Key = "common.export", Language = "ar", Value = "تصدير" },
            new() { Key = "common.import", Language = "en", Value = "Import" },
            new() { Key = "common.import", Language = "ar", Value = "استيراد" },
            new() { Key = "common.actions", Language = "en", Value = "Actions" },
            new() { Key = "common.actions", Language = "ar", Value = "الإجراءات" },
            new() { Key = "common.noData", Language = "en", Value = "No data available" },
            new() { Key = "common.noData", Language = "ar", Value = "لا توجد بيانات متاحة" },
            new() { Key = "common.confirmDelete", Language = "en", Value = "Are you sure you want to delete this item?" },
            new() { Key = "common.confirmDelete", Language = "ar", Value = "هل أنت متأكد من حذف هذا العنصر؟" },
            new() { Key = "common.yes", Language = "en", Value = "Yes" },
            new() { Key = "common.yes", Language = "ar", Value = "نعم" },
            new() { Key = "common.no", Language = "en", Value = "No" },
            new() { Key = "common.no", Language = "ar", Value = "لا" },

            // Navigation labels
            new() { Key = "navigation.dashboard", Language = "en", Value = "Dashboard" },
            new() { Key = "navigation.dashboard", Language = "ar", Value = "لوحة التحكم" },
            new() { Key = "navigation.users", Language = "en", Value = "Users" },
            new() { Key = "navigation.users", Language = "ar", Value = "المستخدمين" },
            new() { Key = "navigation.roles", Language = "en", Value = "Roles" },
            new() { Key = "navigation.roles", Language = "ar", Value = "الأدوار" },
            new() { Key = "navigation.permissions", Language = "en", Value = "Permissions" },
            new() { Key = "navigation.permissions", Language = "ar", Value = "الصلاحيات" },
            new() { Key = "navigation.localization", Language = "en", Value = "Localization" },
            new() { Key = "navigation.localization", Language = "ar", Value = "الترجمة" },
            new() { Key = "navigation.audit", Language = "en", Value = "Audit" },
            new() { Key = "navigation.audit", Language = "ar", Value = "التدقيق" },
            new() { Key = "navigation.settings", Language = "en", Value = "Settings" },
            new() { Key = "navigation.settings", Language = "ar", Value = "الإعدادات" },
            new() { Key = "navigation.profile", Language = "en", Value = "Profile" },
            new() { Key = "navigation.profile", Language = "ar", Value = "الملف الشخصي" },
            new() { Key = "navigation.logout", Language = "en", Value = "Logout" },
            new() { Key = "navigation.logout", Language = "ar", Value = "تسجيل الخروج" },
            new() { Key = "navigation.webhooks", Language = "en", Value = "Webhooks" },
            new() { Key = "navigation.webhooks", Language = "ar", Value = "الويب هوكس" },

            // Auth labels
            new() { Key = "auth.login", Language = "en", Value = "Login" },
            new() { Key = "auth.login", Language = "ar", Value = "تسجيل الدخول" },
            new() { Key = "auth.logout", Language = "en", Value = "Logout" },
            new() { Key = "auth.logout", Language = "ar", Value = "تسجيل الخروج" },
            new() { Key = "auth.email", Language = "en", Value = "Email" },
            new() { Key = "auth.email", Language = "ar", Value = "البريد الإلكتروني" },
            new() { Key = "auth.password", Language = "en", Value = "Password" },
            new() { Key = "auth.password", Language = "ar", Value = "كلمة المرور" },
            new() { Key = "auth.tenantId", Language = "en", Value = "Tenant ID" },
            new() { Key = "auth.tenantId", Language = "ar", Value = "معرف المستأجر" },
            new() { Key = "auth.forgotPassword", Language = "en", Value = "Forgot Password" },
            new() { Key = "auth.forgotPassword", Language = "ar", Value = "نسيت كلمة المرور" },
            new() { Key = "auth.resetPassword", Language = "en", Value = "Reset Password" },
            new() { Key = "auth.resetPassword", Language = "ar", Value = "إعادة تعيين كلمة المرور" },
            new() { Key = "auth.newPassword", Language = "en", Value = "New Password" },
            new() { Key = "auth.newPassword", Language = "ar", Value = "كلمة المرور الجديدة" },
            new() { Key = "auth.confirmPassword", Language = "en", Value = "Confirm Password" },
            new() { Key = "auth.confirmPassword", Language = "ar", Value = "تأكيد كلمة المرور" },
            new() { Key = "auth.token", Language = "en", Value = "Token" },
            new() { Key = "auth.token", Language = "ar", Value = "الرمز المميز" },

            // Users labels
            new() { Key = "users.title", Language = "en", Value = "Users Management" },
            new() { Key = "users.title", Language = "ar", Value = "إدارة المستخدمين" },
            new() { Key = "users.subtitle", Language = "en", Value = "Manage system users and their roles" },
            new() { Key = "users.subtitle", Language = "ar", Value = "إدارة مستخدمي النظام وأدوارهم" },
            new() { Key = "users.name", Language = "en", Value = "Name" },
            new() { Key = "users.name", Language = "ar", Value = "الاسم" },
            new() { Key = "users.email", Language = "en", Value = "Email" },
            new() { Key = "users.email", Language = "ar", Value = "البريد الإلكتروني" },
            new() { Key = "users.role", Language = "en", Value = "Role" },
            new() { Key = "users.role", Language = "ar", Value = "الدور" },
            new() { Key = "users.lastLogin", Language = "en", Value = "Last Login" },
            new() { Key = "users.lastLogin", Language = "ar", Value = "آخر تسجيل دخول" },
            new() { Key = "users.status", Language = "en", Value = "Status" },
            new() { Key = "users.status", Language = "ar", Value = "الحالة" },
            new() { Key = "users.active", Language = "en", Value = "Active" },
            new() { Key = "users.active", Language = "ar", Value = "نشط" },
            new() { Key = "users.inactive", Language = "en", Value = "Inactive" },
            new() { Key = "users.inactive", Language = "ar", Value = "غير نشط" },
            new() { Key = "users.addUser", Language = "en", Value = "Add User" },
            new() { Key = "users.addUser", Language = "ar", Value = "إضافة مستخدم" },
            new() { Key = "users.editUser", Language = "en", Value = "Edit User" },
            new() { Key = "users.editUser", Language = "ar", Value = "تعديل المستخدم" },
            new() { Key = "users.deleteUser", Language = "en", Value = "Delete User" },
            new() { Key = "users.deleteUser", Language = "ar", Value = "حذف المستخدم" },
            new() { Key = "users.assignRole", Language = "en", Value = "Assign Role" },
            new() { Key = "users.assignRole", Language = "ar", Value = "تعيين دور" },
            new() { Key = "users.noRole", Language = "en", Value = "No Role" },
            new() { Key = "users.noRole", Language = "ar", Value = "لا يوجد دور" },
            new() { Key = "users.never", Language = "en", Value = "Never" },
            new() { Key = "users.never", Language = "ar", Value = "أبداً" },

            // Roles labels
            new() { Key = "roles.title", Language = "en", Value = "Roles Management" },
            new() { Key = "roles.title", Language = "ar", Value = "إدارة الأدوار" },
            new() { Key = "roles.subtitle", Language = "en", Value = "Manage system roles and permissions" },
            new() { Key = "roles.subtitle", Language = "ar", Value = "إدارة أدوار النظام والصلاحيات" },
            new() { Key = "roles.name", Language = "en", Value = "Name" },
            new() { Key = "roles.name", Language = "ar", Value = "الاسم" },
            new() { Key = "roles.description", Language = "en", Value = "Description" },
            new() { Key = "roles.description", Language = "ar", Value = "الوصف" },
            new() { Key = "roles.permissions", Language = "en", Value = "Permissions" },
            new() { Key = "roles.permissions", Language = "ar", Value = "الصلاحيات" },
            new() { Key = "roles.users", Language = "en", Value = "Users" },
            new() { Key = "roles.users", Language = "ar", Value = "المستخدمين" },
            new() { Key = "roles.addRole", Language = "en", Value = "Add Role" },
            new() { Key = "roles.addRole", Language = "ar", Value = "إضافة دور" },
            new() { Key = "roles.editRole", Language = "en", Value = "Edit Role" },
            new() { Key = "roles.editRole", Language = "ar", Value = "تعديل الدور" },
            new() { Key = "roles.deleteRole", Language = "en", Value = "Delete Role" },
            new() { Key = "roles.deleteRole", Language = "ar", Value = "حذف الدور" },
            new() { Key = "roles.assignPermissions", Language = "en", Value = "Assign Permissions" },
            new() { Key = "roles.assignPermissions", Language = "ar", Value = "تعيين الصلاحيات" },
            new() { Key = "roles.checkAll", Language = "en", Value = "Check All" },
            new() { Key = "roles.checkAll", Language = "ar", Value = "تحديد الكل" },
            new() { Key = "roles.uncheckAll", Language = "en", Value = "Uncheck All" },
            new() { Key = "roles.uncheckAll", Language = "ar", Value = "إلغاء تحديد الكل" },

            // Permissions labels
            new() { Key = "permissions.title", Language = "en", Value = "Permissions Management" },
            new() { Key = "permissions.title", Language = "ar", Value = "إدارة الصلاحيات" },
            new() { Key = "permissions.subtitle", Language = "en", Value = "Manage system permissions and access control" },
            new() { Key = "permissions.subtitle", Language = "ar", Value = "إدارة صلاحيات النظام والتحكم في الوصول" },
            new() { Key = "permissions.name", Language = "en", Value = "Name" },
            new() { Key = "permissions.name", Language = "ar", Value = "الاسم" },
            new() { Key = "permissions.description", Language = "en", Value = "Description" },
            new() { Key = "permissions.description", Language = "ar", Value = "الوصف" },
            new() { Key = "permissions.category", Language = "en", Value = "Category" },
            new() { Key = "permissions.category", Language = "ar", Value = "الفئة" },
            new() { Key = "permissions.action", Language = "en", Value = "Action" },
            new() { Key = "permissions.action", Language = "ar", Value = "الإجراء" },
            new() { Key = "permissions.roles", Language = "en", Value = "Roles" },
            new() { Key = "permissions.roles", Language = "ar", Value = "الأدوار" },
            new() { Key = "permissions.addPermission", Language = "en", Value = "Add Permission" },
            new() { Key = "permissions.addPermission", Language = "ar", Value = "إضافة صلاحية" },
            new() { Key = "permissions.editPermission", Language = "en", Value = "Edit Permission" },
            new() { Key = "permissions.editPermission", Language = "ar", Value = "تعديل الصلاحية" },
            new() { Key = "permissions.deletePermission", Language = "en", Value = "Delete Permission" },
            new() { Key = "permissions.deletePermission", Language = "ar", Value = "حذف الصلاحية" },
            new() { Key = "permissions.totalPermissions", Language = "en", Value = "Total Permissions" },
            new() { Key = "permissions.totalPermissions", Language = "ar", Value = "إجمالي الصلاحيات" },
            new() { Key = "permissions.withRoles", Language = "en", Value = "With Roles" },
            new() { Key = "permissions.withRoles", Language = "ar", Value = "مع الأدوار" },
            new() { Key = "permissions.totalRoles", Language = "en", Value = "Total Roles" },
            new() { Key = "permissions.totalRoles", Language = "ar", Value = "إجمالي الأدوار" },
            new() { Key = "permissions.avgRolesPerPermission", Language = "en", Value = "Avg Roles/Permission" },
            new() { Key = "permissions.avgRolesPerPermission", Language = "ar", Value = "متوسط الأدوار/الصلاحية" },
            new() { Key = "permissions.categories", Language = "en", Value = "Categories" },
            new() { Key = "permissions.categories", Language = "ar", Value = "الفئات" },

            // Localization labels
            new() { Key = "localization.title", Language = "en", Value = "Localization Management" },
            new() { Key = "localization.title", Language = "ar", Value = "إدارة الترجمة" },
            new() { Key = "localization.subtitle", Language = "en", Value = "Manage translations and language settings" },
            new() { Key = "localization.subtitle", Language = "ar", Value = "إدارة الترجمات وإعدادات اللغة" },
            new() { Key = "localization.translations", Language = "en", Value = "Translations" },
            new() { Key = "localization.translations", Language = "ar", Value = "الترجمات" },
            new() { Key = "localization.languages", Language = "en", Value = "Languages" },
            new() { Key = "localization.languages", Language = "ar", Value = "اللغات" },
            new() { Key = "localization.keys", Language = "en", Value = "Translation Keys" },
            new() { Key = "localization.keys", Language = "ar", Value = "مفاتيح الترجمة" },
            new() { Key = "localization.values", Language = "en", Value = "Translation Values" },
            new() { Key = "localization.values", Language = "ar", Value = "قيم الترجمة" },
            new() { Key = "localization.addTranslation", Language = "en", Value = "Add Translation" },
            new() { Key = "localization.addTranslation", Language = "ar", Value = "إضافة ترجمة" },
            new() { Key = "localization.editTranslation", Language = "en", Value = "Edit Translation" },
            new() { Key = "localization.editTranslation", Language = "ar", Value = "تعديل الترجمة" },
            new() { Key = "localization.importTranslations", Language = "en", Value = "Import Translations" },
            new() { Key = "localization.importTranslations", Language = "ar", Value = "استيراد الترجمات" },
            new() { Key = "localization.exportTranslations", Language = "en", Value = "Export Translations" },
            new() { Key = "localization.exportTranslations", Language = "ar", Value = "تصدير الترجمات" },
            new() { Key = "localization.languageCode", Language = "en", Value = "Language Code" },
            new() { Key = "localization.languageCode", Language = "ar", Value = "رمز اللغة" },
            new() { Key = "localization.translationKey", Language = "en", Value = "Translation Key" },
            new() { Key = "localization.translationKey", Language = "ar", Value = "مفتاح الترجمة" },
            new() { Key = "localization.translationValue", Language = "en", Value = "Translation Value" },
            new() { Key = "localization.translationValue", Language = "ar", Value = "قيمة الترجمة" },
            new() { Key = "localization.missingTranslations", Language = "en", Value = "Missing Translations" },
            new() { Key = "localization.missingTranslations", Language = "ar", Value = "الترجمات المفقودة" },
            new() { Key = "localization.completionStatus", Language = "en", Value = "Completion Status" },
            new() { Key = "localization.completionStatus", Language = "ar", Value = "حالة الاكتمال" },
            new() { Key = "localization.validationErrors", Language = "en", Value = "Validation Errors" },
            new() { Key = "localization.validationErrors", Language = "ar", Value = "أخطاء التحقق" },
            new() { Key = "localization.bulkImport", Language = "en", Value = "Bulk Import" },
            new() { Key = "localization.bulkImport", Language = "ar", Value = "استيراد جماعي" },
            new() { Key = "localization.bulkExport", Language = "en", Value = "Bulk Export" },
            new() { Key = "localization.bulkExport", Language = "ar", Value = "تصدير جماعي" },

            // Audit labels
            new() { Key = "audit.title", Language = "en", Value = "Audit Logs" },
            new() { Key = "audit.title", Language = "ar", Value = "سجلات التدقيق" },
            new() { Key = "audit.subtitle", Language = "en", Value = "View system activity and audit trail" },
            new() { Key = "audit.subtitle", Language = "ar", Value = "عرض نشاط النظام ومسار التدقيق" },
            new() { Key = "audit.timestamp", Language = "en", Value = "Timestamp" },
            new() { Key = "audit.timestamp", Language = "ar", Value = "الطابع الزمني" },
            new() { Key = "audit.action", Language = "en", Value = "Action" },
            new() { Key = "audit.action", Language = "ar", Value = "الإجراء" },
            new() { Key = "audit.actor", Language = "en", Value = "Actor" },
            new() { Key = "audit.actor", Language = "ar", Value = "الفاعل" },
            new() { Key = "audit.resource", Language = "en", Value = "Resource" },
            new() { Key = "audit.resource", Language = "ar", Value = "المورد" },
            new() { Key = "audit.details", Language = "en", Value = "Details" },
            new() { Key = "audit.details", Language = "ar", Value = "التفاصيل" },
            new() { Key = "audit.ipAddress", Language = "en", Value = "IP Address" },
            new() { Key = "audit.ipAddress", Language = "ar", Value = "عنوان IP" },
            new() { Key = "audit.userAgent", Language = "en", Value = "User Agent" },
            new() { Key = "audit.userAgent", Language = "ar", Value = "وكيل المستخدم" },

            // Webhooks labels
            new() { Key = "webhooks.title", Language = "en", Value = "Webhooks Management" },
            new() { Key = "webhooks.title", Language = "ar", Value = "إدارة الويب هوكس" },
            new() { Key = "webhooks.subtitle", Language = "en", Value = "Manage webhook endpoints and configurations" },
            new() { Key = "webhooks.subtitle", Language = "ar", Value = "إدارة نقاط نهاية الويب هوكس والتكوينات" },
            new() { Key = "webhooks.name", Language = "en", Value = "Name" },
            new() { Key = "webhooks.name", Language = "ar", Value = "الاسم" },
            new() { Key = "webhooks.url", Language = "en", Value = "URL" },
            new() { Key = "webhooks.url", Language = "ar", Value = "الرابط" },
            new() { Key = "webhooks.events", Language = "en", Value = "Events" },
            new() { Key = "webhooks.events", Language = "ar", Value = "الأحداث" },
            new() { Key = "webhooks.status", Language = "en", Value = "Status" },
            new() { Key = "webhooks.status", Language = "ar", Value = "الحالة" },
            new() { Key = "webhooks.addWebhook", Language = "en", Value = "Add Webhook" },
            new() { Key = "webhooks.addWebhook", Language = "ar", Value = "إضافة ويب هوك" },
            new() { Key = "webhooks.editWebhook", Language = "en", Value = "Edit Webhook" },
            new() { Key = "webhooks.editWebhook", Language = "ar", Value = "تعديل الويب هوك" },
            new() { Key = "webhooks.deleteWebhook", Language = "en", Value = "Delete Webhook" },
            new() { Key = "webhooks.deleteWebhook", Language = "ar", Value = "حذف الويب هوك" },

            // Pagination labels
            new() { Key = "pagination.firstPage", Language = "en", Value = "First page" },
            new() { Key = "pagination.firstPage", Language = "ar", Value = "الصفحة الأولى" },
            new() { Key = "pagination.previousPage", Language = "en", Value = "Previous page" },
            new() { Key = "pagination.previousPage", Language = "ar", Value = "الصفحة السابقة" },
            new() { Key = "pagination.nextPage", Language = "en", Value = "Next page" },
            new() { Key = "pagination.nextPage", Language = "ar", Value = "الصفحة التالية" },
            new() { Key = "pagination.lastPage", Language = "en", Value = "Last page" },
            new() { Key = "pagination.lastPage", Language = "ar", Value = "الصفحة الأخيرة" },
            new() { Key = "pagination.pageSize", Language = "en", Value = "Page Size" },
            new() { Key = "pagination.pageSize", Language = "ar", Value = "حجم الصفحة" },
            new() { Key = "pagination.of", Language = "en", Value = "of" },
            new() { Key = "pagination.of", Language = "ar", Value = "من" },
            new() { Key = "pagination.results", Language = "en", Value = "results" },
            new() { Key = "pagination.results", Language = "ar", Value = "نتائج" },

            // Search labels
            new() { Key = "search.clearSearch", Language = "en", Value = "Clear search" },
            new() { Key = "search.clearSearch", Language = "ar", Value = "مسح البحث" },
            new() { Key = "search.searchPlaceholder", Language = "en", Value = "Search..." },
            new() { Key = "search.searchPlaceholder", Language = "ar", Value = "بحث..." },

            // Dashboard labels
            new() { Key = "dashboard.title", Language = "en", Value = "Dashboard" },
            new() { Key = "dashboard.title", Language = "ar", Value = "لوحة التحكم" },
            new() { Key = "dashboard.welcome", Language = "en", Value = "Welcome to Authoria" },
            new() { Key = "dashboard.welcome", Language = "ar", Value = "مرحباً بك في Authoria" },
            new() { Key = "dashboard.totalUsers", Language = "en", Value = "Total Users" },
            new() { Key = "dashboard.totalUsers", Language = "ar", Value = "إجمالي المستخدمين" },
            new() { Key = "dashboard.activeRoles", Language = "en", Value = "Active Roles" },
            new() { Key = "dashboard.activeRoles", Language = "ar", Value = "الأدوار النشطة" },
            new() { Key = "dashboard.recentActivity", Language = "en", Value = "Recent Activity" },
            new() { Key = "dashboard.recentActivity", Language = "ar", Value = "النشاط الأخير" },
            new() { Key = "dashboard.systemStatus", Language = "en", Value = "System Status" },
            new() { Key = "dashboard.systemStatus", Language = "ar", Value = "حالة النظام" },
            new() { Key = "dashboard.connectionTimeout", Language = "en", Value = "Connection timeout" },
            new() { Key = "dashboard.connectionTimeout", Language = "ar", Value = "انتهاء مهلة الاتصال" },
            new() { Key = "dashboard.failed", Language = "en", Value = "Failed" },
            new() { Key = "dashboard.failed", Language = "ar", Value = "فشل" },
            new() { Key = "dashboard.success", Language = "en", Value = "Success" },
            new() { Key = "dashboard.success", Language = "ar", Value = "نجح" },

            // App labels
            new() { Key = "app.name", Language = "en", Value = "Authoria" },
            new() { Key = "app.name", Language = "ar", Value = "Authoria" },
            new() { Key = "app.admin", Language = "en", Value = "Admin" },
            new() { Key = "app.admin", Language = "ar", Value = "مدير" },
            new() { Key = "app.openDrawer", Language = "en", Value = "open drawer" },
            new() { Key = "app.openDrawer", Language = "ar", Value = "فتح الدرج" }
        };

        foreach (var label in labels)
        {
            if (!await _context.LocalizationLabels.AnyAsync(l => l.Key == label.Key && l.Language == label.Language))
            {
                _context.LocalizationLabels.Add(label);
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Localization labels seeded successfully");
    }
}
