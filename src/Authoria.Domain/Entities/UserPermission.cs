namespace Authoria.Domain.Entities;

public class UserPermission
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid PermissionId { get; set; }
    public Guid TenantId { get; set; }
    public Guid ApplicationId { get; set; }
    public DateTime GrantedAtUtc { get; set; } = DateTime.UtcNow;
    public Guid? GrantedByUserId { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Permission Permission { get; set; } = null!;
    public User? GrantedByUser { get; set; }
    public Tenant? Tenant { get; set; }
}
