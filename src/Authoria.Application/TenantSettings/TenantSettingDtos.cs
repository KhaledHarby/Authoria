namespace Authoria.Application.TenantSettings;

public class TenantSettingDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
}

public class UpdateTenantSettingRequest
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public class TokenExpirySettingDto
{
    public int TokenExpiryMinutes { get; set; } = 50; // Default 50 minutes
}
