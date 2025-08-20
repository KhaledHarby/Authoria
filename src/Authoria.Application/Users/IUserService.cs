using Authoria.Application.Users.Dtos;
using Authoria.Application.Common;

namespace Authoria.Application.Users;

public interface IUserService
{
	Task<PaginationResponse<UserDto>> ListAsync(PaginationRequest request, CancellationToken ct = default);
	Task<PaginationResponse<UserDto>> ListAllTenantUsersAsync(PaginationRequest request, CancellationToken ct = default);
	Task<UserDto?> GetAsync(Guid id, CancellationToken ct = default);
	Task<UserDto> CreateAsync(CreateUserRequest req, CancellationToken ct = default);
	Task<UserDto?> UpdateAsync(Guid id, UpdateUserRequest req, CancellationToken ct = default);
	Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
	
	// Permission management methods
	Task<UserPermissionsResponse> GetUserPermissionsAsync(Guid userId, CancellationToken ct = default);
	Task<UserPermissionDto> AssignPermissionAsync(AssignUserPermissionRequest request, Guid grantedByUserId, CancellationToken ct = default);
	Task<bool> RemovePermissionAsync(RemoveUserPermissionRequest request, CancellationToken ct = default);
	Task<List<string>> GetUserAllPermissionsAsync(Guid userId, CancellationToken ct = default);
}




