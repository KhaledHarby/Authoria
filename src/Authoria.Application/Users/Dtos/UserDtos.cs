namespace Authoria.Application.Users.Dtos;

public class UserDto
{
	public Guid Id { get; set; }
	public string Email { get; set; } = string.Empty;
	public string FirstName { get; set; } = string.Empty;
	public string LastName { get; set; } = string.Empty;
	public string Status { get; set; } = string.Empty;
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


