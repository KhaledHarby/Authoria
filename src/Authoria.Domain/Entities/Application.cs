namespace Authoria.Domain.Entities;

public class Application
{
	public Guid Id { get; set; }
	public Guid TenantId { get; set; }
	public string Name { get; set; } = string.Empty;
	public string? Description { get; set; }
	public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

	public Tenant Tenant { get; set; } = null!;
}
