using Authoria.Application.Abstractions;
using Authoria.Application.TenantSettings;
using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Authoria.Infrastructure.Services.TenantSettings;

public class TenantSettingService : ITenantSettingService
{
    private readonly AuthoriaDbContext _db;
    private readonly ICurrentUserContext _current;

    public TenantSettingService(AuthoriaDbContext db, ICurrentUserContext current)
    {
        _db = db;
        _current = current;
    }

    public async Task<List<TenantSettingDto>> GetAllAsync(CancellationToken ct = default)
    {
        var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required");

        var settings = await _db.TenantSettings
            .Where(ts => ts.TenantId == tenantId)
            .Select(ts => new TenantSettingDto
            {
                Id = ts.Id,
                TenantId = ts.TenantId,
                Key = ts.Key,
                Value = ts.Value,
                CreatedAtUtc = ts.CreatedAtUtc,
                UpdatedAtUtc = ts.UpdatedAtUtc
            })
            .ToListAsync(ct);

        return settings;
    }

    public async Task<TenantSettingDto?> GetByKeyAsync(string key, CancellationToken ct = default)
    {
        var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required");

        var setting = await _db.TenantSettings
            .Where(ts => ts.TenantId == tenantId && ts.Key == key)
            .Select(ts => new TenantSettingDto
            {
                Id = ts.Id,
                TenantId = ts.TenantId,
                Key = ts.Key,
                Value = ts.Value,
                CreatedAtUtc = ts.CreatedAtUtc,
                UpdatedAtUtc = ts.UpdatedAtUtc
            })
            .FirstOrDefaultAsync(ct);

        return setting;
    }

    public async Task<TenantSettingDto> SetAsync(string key, string value, CancellationToken ct = default)
    {
        var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required");

        var existing = await _db.TenantSettings
            .FirstOrDefaultAsync(ts => ts.TenantId == tenantId && ts.Key == key, ct);

        if (existing != null)
        {
            existing.Value = value;
            existing.UpdatedAtUtc = DateTime.UtcNow;
        }
        else
        {
            existing = new TenantSetting
            {
                TenantId = tenantId,
                Key = key,
                Value = value,
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow
            };
            _db.TenantSettings.Add(existing);
        }

        await _db.SaveChangesAsync(ct);

        return new TenantSettingDto
        {
            Id = existing.Id,
            TenantId = existing.TenantId,
            Key = existing.Key,
            Value = existing.Value,
            CreatedAtUtc = existing.CreatedAtUtc,
            UpdatedAtUtc = existing.UpdatedAtUtc
        };
    }

    public async Task<TokenExpirySettingDto> GetTokenExpiryAsync(CancellationToken ct = default)
    {
        string key = "token_expiry_minutes";
        var setting = await GetByKeyAsync(key, ct);

        var minutes = 50; // Default
        if (setting != null && int.TryParse(setting.Value, out var parsedMinutes))
        {
            minutes = parsedMinutes;
        }

        return new TokenExpirySettingDto { TokenExpiryMinutes = minutes };
    }

    public async Task<TokenExpirySettingDto> SetTokenExpiryAsync(int minutes, CancellationToken ct = default)
    {
        string key = "token_expiry_minutes";
        
        if (minutes <= 0)
        {
            throw new ArgumentException("Token expiry minutes must be greater than 0", nameof(minutes));
        }

        await SetAsync(key, minutes.ToString(), ct);

        return new TokenExpirySettingDto { TokenExpiryMinutes = minutes };
    }

    public async Task DeleteAsync(string key, CancellationToken ct = default)
    {
        var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required");

        var setting = await _db.TenantSettings
            .FirstOrDefaultAsync(ts => ts.TenantId == tenantId && ts.Key == key, ct);

        if (setting != null)
        {
            _db.TenantSettings.Remove(setting);
            await _db.SaveChangesAsync(ct);
        }
    }
}
