namespace Authoria.Application.Applications;

public class ApplicationDto
{
	public Guid Id { get; set; }
	public Guid TenantId { get; set; }
	public string Name { get; set; } = string.Empty;
	public string? Description { get; set; }
	public DateTime CreatedAtUtc { get; set; }
	public bool IsActive { get; set; }
}

public class CreateApplicationRequest
{
	public string Name { get; set; } = string.Empty;
	public string? Description { get; set; }
}

public class UserApplicationItem
{
	public Guid Id { get; set; }
	public string Name { get; set; } = string.Empty;
}

public class ApplicationUserDto
{
	public Guid Id { get; set; }
	public string FirstName { get; set; } = string.Empty;
	public string LastName { get; set; } = string.Empty;
	public string Email { get; set; } = string.Empty;
}
