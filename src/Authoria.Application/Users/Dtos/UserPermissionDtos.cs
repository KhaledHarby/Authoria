namespace Authoria.Application.Users.Dtos;

public class UserPermissionDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid PermissionId { get; set; }
    public string PermissionName { get; set; } = string.Empty;
    public string? PermissionDescription { get; set; }
    public DateTime GrantedAtUtc { get; set; }
    public Guid? GrantedByUserId { get; set; }
    public string? GrantedByUserName { get; set; }
    public string? Notes { get; set; }
}

public class AssignUserPermissionRequest
{
    public Guid UserId { get; set; }
    public Guid PermissionId { get; set; }
    public string? Notes { get; set; }
}

public class RemoveUserPermissionRequest
{
    public Guid UserId { get; set; }
    public Guid PermissionId { get; set; }
}

public class UserPermissionsResponse
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public List<UserPermissionDto> DirectPermissions { get; set; } = new();
    public List<RolePermissionDto> RolePermissions { get; set; } = new();
    public List<string> AllPermissions { get; set; } = new(); // Combined unique permissions
}

public class RolePermissionDto
{
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public List<string> Permissions { get; set; } = new();
}
