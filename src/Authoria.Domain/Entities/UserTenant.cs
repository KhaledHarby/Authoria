namespace Authoria.Domain.Entities;

public class UserTenant
{
	public Guid UserId { get; set; }
	public User User { get; set; } = default!;
	public Guid TenantId { get; set; }
	public Tenant Tenant { get; set; } = default!;
}




