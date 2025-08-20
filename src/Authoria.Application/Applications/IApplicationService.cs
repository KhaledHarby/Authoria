using Authoria.Application.Abstractions;

namespace Authoria.Application.Applications;

public interface IApplicationService
{
	Task<List<ApplicationDto>> ListAsync(CancellationToken ct = default);
	Task<ApplicationDto> CreateAsync(CreateApplicationRequest request, CancellationToken ct = default);
	Task<ApplicationDto> UpdateAsync(Guid id, CreateApplicationRequest request, CancellationToken ct = default);
	Task DeleteAsync(Guid id, CancellationToken ct = default);
	Task<List<UserApplicationItem>> ListUserApplicationsAsync(Guid userId, CancellationToken ct = default);
	Task AddUserAsync(Guid applicationId, Guid userId, CancellationToken ct = default);
	Task RemoveUserAsync(Guid applicationId, Guid userId, CancellationToken ct = default);
	Task<List<ApplicationUserDto>> ListApplicationUsersAsync(Guid applicationId, CancellationToken ct = default);
	Task SetActiveAsync(Guid applicationId, bool isActive, CancellationToken ct = default);
	Task<List<Guid>> GetActiveApplicationIdsAsync(CancellationToken ct = default);
}
