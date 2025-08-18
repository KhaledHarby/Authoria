namespace Authoria.Domain.Entities;

public class Role
{
	public Guid Id { get; set; }
	public string Name { get; set; } = string.Empty;
	public string? Description { get; set; }
	public Guid? ParentRoleId { get; set; }
	public Role? ParentRole { get; set; }

	public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
	public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}




