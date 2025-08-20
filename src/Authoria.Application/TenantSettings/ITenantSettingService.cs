namespace Authoria.Application.TenantSettings;

public interface ITenantSettingService
{
    Task<List<TenantSettingDto>> GetAllAsync(CancellationToken ct = default);
    Task<TenantSettingDto?> GetByKeyAsync(string key, CancellationToken ct = default);
    Task<TenantSettingDto> SetAsync(string key, string value, CancellationToken ct = default);
    Task<TokenExpirySettingDto> GetTokenExpiryAsync(CancellationToken ct = default);
    Task<TokenExpirySettingDto> SetTokenExpiryAsync(int minutes, CancellationToken ct = default);
    Task DeleteAsync(string key, CancellationToken ct = default);
}
