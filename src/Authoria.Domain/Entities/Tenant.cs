namespace Authoria.Domain.Entities;

public class Tenant
{
	public Guid Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public string? Domain { get; set; }
	public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

	public ICollection<UserTenant> UserTenants { get; set; } = new List<UserTenant>();
	public ICollection<TenantSetting> TenantSettings { get; set; } = new List<TenantSetting>();
}




