namespace Authoria.Application.Users.Dtos;

public class UserDto
{
	public Guid Id { get; set; }
	public string Email { get; set; } = string.Empty;
	public string FirstName { get; set; } = string.Empty;
	public string LastName { get; set; } = string.Empty;
	public string Status { get; set; } = string.Empty;
	public DateTime? LastLoginAtUtc { get; set; }
	public List<UserRoleBriefDto> UserRoles { get; set; } = new();
}

public class CreateUserRequest
{
	public string Email { get; set; } = string.Empty;
	public string Password { get; set; } = string.Empty;
	public string FirstName { get; set; } = string.Empty;
	public string LastName { get; set; } = string.Empty;
}

public class UpdateUserRequest
{
	public string? FirstName { get; set; }
	public string? LastName { get; set; }
	public string? Status { get; set; }
}

public class UserRoleBriefDto
{
	public Guid RoleId { get; set; }
	public string RoleName { get; set; } = string.Empty;
}



