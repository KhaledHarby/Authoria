namespace Authoria.Domain.Entities;

public class User
{
	public Guid Id { get; set; }
	public string Email { get; set; } = string.Empty;
	public string PasswordHash { get; set; } = string.Empty;
	public string FirstName { get; set; } = string.Empty;
	public string LastName { get; set; } = string.Empty;
	public UserStatus Status { get; set; } = UserStatus.Active;
	public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
	public DateTime? LockedUntilUtc { get; set; }
	public DateTime? LastLoginAtUtc { get; set; }

	public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
	public ICollection<UserTenant> UserTenants { get; set; } = new List<UserTenant>();
	public ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
	public ICollection<UserApplication> UserApplications { get; set; } = new List<UserApplication>();
}




