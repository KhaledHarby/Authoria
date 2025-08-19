using Authoria.Domain.Entities;
using Authoria.Application.Common;

namespace Authoria.Application.Roles;

public interface IRoleService
{
	Task<PaginationResponse<RoleDto>> ListAsync(PaginationRequest request, CancellationToken ct = default);
	Task<RoleDto> CreateAsync(CreateRoleRequest request, CancellationToken ct = default);
	Task<RoleDto?> UpdateAsync(Guid id, UpdateRoleRequest request, CancellationToken ct = default);
	Task<bool> AssignPermissionAsync(Guid roleId, Guid permissionId, CancellationToken ct = default);
	Task<bool> RemovePermissionAsync(Guid roleId, Guid permissionId, CancellationToken ct = default);
	Task<bool> AssignRoleToUserAsync(Guid userId, Guid roleId, CancellationToken ct = default);
	Task<bool> RemoveRoleFromUserAsync(Guid userId, Guid roleId, CancellationToken ct = default);
	Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
}




