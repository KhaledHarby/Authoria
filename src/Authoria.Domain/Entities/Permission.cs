namespace Authoria.Domain.Entities;

public class Permission
{
	public Guid Id { get; set; }
	public string Name { get; set; } = string.Empty; // e.g., user.create
	public string? Description { get; set; }

	public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
	public ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
}




