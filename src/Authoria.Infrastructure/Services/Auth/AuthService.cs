using Authoria.Application.Abstractions;
using Authoria.Application.Auth;
using Authoria.Application.Auth.Dtos;
using Authoria.Application.Audit;
using Authoria.Application.Applications;
using Authoria.Application.TenantSettings;
using Authoria.Infrastructure.Persistence;
using Authoria.Infrastructure.Services.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace Authoria.Infrastructure.Services.Auth;

public class AuthService : IAuthService
{
    private readonly AuthoriaDbContext _db;
    private readonly ITokenService _tokens;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuditService _auditService;
    private readonly IApplicationService _applicationService;
    private readonly ITenantSettingService _tenantSettingService;
    private readonly IDistributedCache _cache;
    private static readonly TimeSpan _userPermissionsCacheExpiry = TimeSpan.FromMinutes(15);
    
    public AuthService(
        AuthoriaDbContext db, 
        ITokenService tokens, 
        IPasswordHasher passwordHasher, 
        IAuditService auditService, 
        IApplicationService applicationService, 
        ITenantSettingService tenantSettingService,
        IDistributedCache cache)
    {
        _db = db;
        _tokens = tokens;
        _passwordHasher = passwordHasher;
        _auditService = auditService;
        _applicationService = applicationService;
        _tenantSettingService = tenantSettingService;
        _cache = cache;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest req, string? userAgent, string? ipAddress, CancellationToken ct = default)
    {
        // Query user with an optimized select to avoid loading unnecessary fields
        var user = await _db.Users
            .Select(u => new { u.Id, u.Email, u.PasswordHash, u.Status })
            .FirstOrDefaultAsync(u => u.Email == req.Email, ct);

        if (user == null || user.Status != Domain.Entities.UserStatus.Active) 
        {
            await _auditService.LogUserActionAsync("auth.login.failed", "user", null, new { email = req.Email, reason = "User not found or inactive" });
            return null;
        }
        
        if (!_passwordHasher.VerifyPassword(req.Password, user.PasswordHash))
        {
            await _auditService.LogUserActionAsync("auth.login.failed", "user", user.Id.ToString(), new { email = req.Email, reason = "Invalid password" });
            return null;
        }

        var cacheKey = $"user_auth:{user.Id}";
        var cachedData = await _cache.GetStringAsync(cacheKey, ct);
        List<string> roles;
        List<string> permissions;

        if (cachedData == null)
        {
            // Load roles and permissions in parallel
            var rolesTask = _db.UserRoles
                .Where(x => x.UserId == user.Id)
                .Select(x => x.Role.Name)
                .ToListAsync(ct);

            var permissionsTask = _db.RolePermissions
                .Where(rp => _db.UserRoles.Where(ur => ur.UserId == user.Id)
                    .Select(ur => ur.RoleId)
                    .Contains(rp.RoleId))
                .Select(rp => rp.Permission.Name)
                .Distinct()
                .ToListAsync(ct);

            await Task.WhenAll(rolesTask, permissionsTask);
            roles = await rolesTask;
            permissions = await permissionsTask;

            // Cache the results
            var cacheData = JsonSerializer.Serialize(new { roles, permissions });
            await _cache.SetStringAsync(cacheKey, cacheData, 
                new DistributedCacheEntryOptions 
                { 
                    AbsoluteExpirationRelativeToNow = _userPermissionsCacheExpiry 
                }, ct);
        }
        else
        {
            var cacheObj = JsonSerializer.Deserialize<dynamic>(cachedData)!;
            roles = ((JsonElement)cacheObj.roles).EnumerateArray().Select(x => x.GetString()!).ToList();
            permissions = ((JsonElement)cacheObj.permissions).EnumerateArray().Select(x => x.GetString()!).ToList();
        }
        
        // Get user's tenant ID with optimized query
        var userTenant = await _db.UserTenants
            .Select(ut => new { ut.UserId, ut.TenantId })
            .FirstOrDefaultAsync(ut => ut.UserId == user.Id, ct);
        var tenantId = userTenant?.TenantId;
        
        // Get user's active applications with optimized query
        var activeApplicationIds = await _db.UserApplications
            .Where(ua => ua.UserId == user.Id && ua.IsActive)
            .Select(ua => ua.ApplicationId)
            .ToListAsync(ct);
        var primaryApplicationId = activeApplicationIds.FirstOrDefault();
        
        var tokenExpirySetting = await GetTokenExpiryForTenantAsync(tenantId, ct);
        
        var (accessToken, exp) = _tokens.CreateAccessToken(user.Id, req.TenantId, roles, permissions, primaryApplicationId, activeApplicationIds, tokenExpirySetting.TokenExpiryMinutes);
        var (refresh, refreshExp) = _tokens.CreateRefreshToken(user.Id, userAgent, ipAddress);
        
        _db.RefreshTokens.Add(new Domain.Entities.RefreshToken 
        { 
            UserId = user.Id, 
            Token = refresh, 
            ExpiresAtUtc = refreshExp, 
            IpAddress = ipAddress, 
            Device = userAgent 
        });

        // Update last login with minimal data load
        await _db.Users
            .Where(u => u.Id == user.Id)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.LastLoginAtUtc, DateTime.UtcNow), ct);
        
        await _auditService.LogUserActionAsync("auth.login.success", "user", user.Id.ToString(), 
            new { email = req.Email, roles, permissions, applications = activeApplicationIds });
        
        return new LoginResponse { AccessToken = accessToken, RefreshToken = refresh, ExpiresAtUtc = exp };
    }

    public async Task<LoginResponse?> RefreshAsync(RefreshTokenRequest req, CancellationToken ct = default)
    {
        var rt = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == req.RefreshToken && x.RevokedAtUtc == null, ct);
        if (rt == null || rt.ExpiresAtUtc < DateTime.UtcNow) return null;
        var user = await _db.Users.FindAsync(new object?[] { rt.UserId }, ct);
        if (user == null) return null;
        var roles = await _db.UserRoles.Where(x => x.UserId == user.Id).Select(x => x.Role.Name).ToListAsync(ct);
        var permissions = await _db.RolePermissions
            .Where(rp => _db.UserRoles.Where(ur => ur.UserId == user.Id).Select(ur => ur.RoleId).Contains(rp.RoleId))
            .Select(rp => rp.Permission.Name).Distinct().ToListAsync(ct);
        
        // Get user's tenant ID
        var userTenant = await _db.UserTenants.FirstOrDefaultAsync(ut => ut.UserId == user.Id, ct);
        var tenantId = userTenant?.TenantId;
        
        // Get user's active applications without relying on _current
        var activeApplicationIds = await _db.UserApplications.AsNoTracking()
            .Where(ua => ua.UserId == user.Id && ua.IsActive)
            .Select(ua => ua.ApplicationId)
            .ToListAsync(ct);
        var primaryApplicationId = activeApplicationIds.FirstOrDefault();
        
        // Get token expiry setting from tenant
        var tokenExpirySetting = await GetTokenExpiryForTenantAsync(tenantId, ct);
        
        var (accessToken, exp) = _tokens.CreateAccessToken(user.Id, null, roles, permissions, primaryApplicationId, activeApplicationIds, tokenExpirySetting.TokenExpiryMinutes);
        return new LoginResponse { AccessToken = accessToken, RefreshToken = req.RefreshToken, ExpiresAtUtc = exp };
    }

    public async Task<bool> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email, ct);
        if (user == null) return true; // don't reveal user existence
        var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Convert.ToBase64String(Guid.NewGuid().ToByteArray());
        var expires = DateTime.UtcNow.AddHours(2);
        _db.PasswordResetTokens.Add(new Domain.Entities.PasswordResetToken
        {
            UserId = user.Id,
            Token = token,
            ExpiresAtUtc = expires
        });
        await _db.SaveChangesAsync(ct);
        // TODO: send email with token
        return true;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
    {
        var pr = await _db.PasswordResetTokens.Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Token == request.Token && x.UsedAtUtc == null, ct);
        if (pr == null || pr.ExpiresAtUtc < DateTime.UtcNow) return false;
        
        // Hash the new password properly
        pr.User.PasswordHash = _passwordHasher.HashPassword(request.NewPassword);
        pr.UsedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private async Task<TokenExpirySettingDto> GetTokenExpiryForTenantAsync(Guid? tenantId, CancellationToken ct = default)
    {
        if (!tenantId.HasValue)
        {
            return new TokenExpirySettingDto { TokenExpiryMinutes = 50 };
        }

        var cacheKey = $"token_expiry:{tenantId}";
        var cachedValue = await _cache.GetStringAsync(cacheKey, ct);
        
        if (cachedValue != null)
        {
            return new TokenExpirySettingDto { TokenExpiryMinutes = int.Parse(cachedValue) };
        }

        var setting = await _db.TenantSettings
            .Where(ts => ts.TenantId == tenantId.Value && ts.Key == "token_expiry_minutes")
            .Select(ts => ts.Value)
            .FirstOrDefaultAsync(ct);

        var minutes = 50; // Default
        if (setting != null && int.TryParse(setting, out var parsedMinutes))
        {
            minutes = parsedMinutes;
        }

        // Cache the result
        await _cache.SetStringAsync(cacheKey, minutes.ToString(),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
            }, ct);

        return new TokenExpirySettingDto { TokenExpiryMinutes = minutes };
    }
}


