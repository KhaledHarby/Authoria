using Authoria.Application.Abstractions;
using Authoria.Application.Auth;
using Authoria.Application.Auth.Dtos;
using Authoria.Application.Audit;
using Authoria.Application.Applications;
using Authoria.Application.TenantSettings;
using Authoria.Infrastructure.Persistence;
using Authoria.Infrastructure.Services.Security;
using Microsoft.EntityFrameworkCore;

namespace Authoria.Infrastructure.Services.Auth;

public class AuthService : IAuthService
{
    private readonly AuthoriaDbContext _db;
    private readonly ITokenService _tokens;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IAuditService _auditService;
    private readonly IApplicationService _applicationService;
    private readonly ITenantSettingService _tenantSettingService;
    
    public AuthService(AuthoriaDbContext db, ITokenService tokens, IPasswordHasher passwordHasher, IAuditService auditService, IApplicationService applicationService, ITenantSettingService tenantSettingService)
    {
        _db = db; 
        _tokens = tokens;
        _passwordHasher = passwordHasher;
        _auditService = auditService;
        _applicationService = applicationService;
        _tenantSettingService = tenantSettingService;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest req, string? userAgent, string? ipAddress, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email, ct);
        if (user == null || user.Status != Domain.Entities.UserStatus.Active) 
        {
            // Audit failed login attempt
            await _auditService.LogUserActionAsync("auth.login.failed", "user", null, new { email = req.Email, reason = "User not found or inactive" });
            return null;
        }
        
        // Verify password
        if (!_passwordHasher.VerifyPassword(req.Password, user.PasswordHash))
        {
            // Audit failed login attempt
            await _auditService.LogUserActionAsync("auth.login.failed", "user", user.Id.ToString(), new { email = req.Email, reason = "Invalid password" });
            return null; // Invalid password
        }
        
        var roles = await _db.UserRoles.Where(x => x.UserId == user.Id).Select(x => x.Role.Name).ToListAsync(ct);
        var permissions = await _db.RolePermissions
            .Where(rp => _db.UserRoles.Where(ur => ur.UserId == user.Id).Select(ur => ur.RoleId).Contains(rp.RoleId))
            .Select(rp => rp.Permission.Name).Distinct().ToListAsync(ct);
        
        // Get user's tenant ID
        var userTenant = await _db.UserTenants.FirstOrDefaultAsync(ut => ut.UserId == user.Id, ct);
        var tenantId = userTenant?.TenantId;
        
        // Get user's active applications without relying on _current (not set during login)
        var activeApplicationIds = await _db.UserApplications.AsNoTracking()
            .Where(ua => ua.UserId == user.Id)
            .Select(ua => ua.ApplicationId)
            .ToListAsync(ct);
        var primaryApplicationId = activeApplicationIds.FirstOrDefault();
        
        // Get token expiry setting from tenant
        var tokenExpirySetting = await GetTokenExpiryForTenantAsync(tenantId, ct);
        
        var (accessToken, exp) = _tokens.CreateAccessToken(user.Id, req.TenantId, roles, permissions, primaryApplicationId, activeApplicationIds, tokenExpirySetting.TokenExpiryMinutes);
        var (refresh, refreshExp) = _tokens.CreateRefreshToken(user.Id, userAgent, ipAddress);
        _db.RefreshTokens.Add(new Domain.Entities.RefreshToken { UserId = user.Id, Token = refresh, ExpiresAtUtc = refreshExp, IpAddress = ipAddress, Device = userAgent });
        user.LastLoginAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        
        // Audit successful login
        await _auditService.LogUserActionAsync("auth.login.success", "user", user.Id.ToString(), new { email = req.Email, roles, permissions, applications = activeApplicationIds });
        
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
            return new TokenExpirySettingDto { TokenExpiryMinutes = 50 }; // Default
        }

        var setting = await _db.TenantSettings
            .Where(ts => ts.TenantId == tenantId.Value && ts.Key == "token_expiry_minutes")
            .FirstOrDefaultAsync(ct);

        var minutes = 50; // Default
        if (setting != null && int.TryParse(setting.Value, out var parsedMinutes))
        {
            minutes = parsedMinutes;
        }

        return new TokenExpirySettingDto { TokenExpiryMinutes = minutes };
    }
}


