using Authoria.Application.Users.Dtos;
using Authoria.Application.Common;

namespace Authoria.Application.Users;

public interface IUserService
{
	Task<PaginationResponse<UserDto>> ListAsync(PaginationRequest request, CancellationToken ct = default);
	Task<UserDto?> GetAsync(Guid id, CancellationToken ct = default);
	Task<UserDto> CreateAsync(CreateUserRequest req, CancellationToken ct = default);
	Task<UserDto?> UpdateAsync(Guid id, UpdateUserRequest req, CancellationToken ct = default);
	Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
}




