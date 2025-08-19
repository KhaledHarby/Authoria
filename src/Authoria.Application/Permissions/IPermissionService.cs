using Authoria.Domain.Entities;
using Authoria.Application.Common;

namespace Authoria.Application.Permissions;

public interface IPermissionService
{
	Task<PaginationResponse<Permission>> ListAsync(PaginationRequest request, CancellationToken ct = default);
	Task<Permission> CreateAsync(Permission permission, CancellationToken ct = default);
}




