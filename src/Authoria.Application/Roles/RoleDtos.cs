namespace Authoria.Application.Roles;

public class RoleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public List<RolePermissionDto> RolePermissions { get; set; } = new();
    public List<UserRoleDto> UserRoles { get; set; } = new();
}

public class RolePermissionDto
{
    public Guid RoleId { get; set; }
    public Guid PermissionId { get; set; }
    public PermissionDto Permission { get; set; } = new();
}

public class UserRoleDto
{
    public Guid UserId { get; set; }
    public Guid RoleId { get; set; }
}

public class PermissionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class CreateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateRoleRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}
