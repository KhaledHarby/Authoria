using Authoria.Domain.Entities;
using Authoria.Application.Common;

namespace Authoria.Application.Audit;

public interface IAuditQueryService
{
	Task<IReadOnlyList<AuditLog>> RecentAsync(int take = 200, CancellationToken ct = default);
	Task<PaginationResponse<AuditLog>> ListAsync(PaginationRequest request, CancellationToken ct = default);
}




