using Authoria.Application.Audit;
using Authoria.Application.Abstractions;
using Authoria.Application.Common;
using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Authoria.Infrastructure.Services.Audit;

public class AuditQueryService : IAuditQueryService
{
	private readonly AuthoriaDbContext _db;
	private readonly ICurrentUserContext _current;
	public AuditQueryService(AuthoriaDbContext db, ICurrentUserContext current) { _db = db; _current = current; }

	public async Task<IReadOnlyList<AuditLog>> RecentAsync(int take = 200, CancellationToken ct = default)
	{
		if (!_current.HasPermission("audit.view")) throw new UnauthorizedAccessException("Missing permission: audit.view");
		return await _db.AuditLogs.AsNoTracking().OrderByDescending(a => a.OccurredAtUtc).Take(take).ToListAsync(ct);
	}

	public async Task<PaginationResponse<AuditLog>> ListAsync(PaginationRequest request, CancellationToken ct = default)
	{
		if (!_current.HasPermission("audit.view")) throw new UnauthorizedAccessException("Missing permission: audit.view");
		
		var query = _db.AuditLogs.AsNoTracking();
		
		// Apply search filter
		if (!string.IsNullOrWhiteSpace(request.SearchTerm))
		{
			var searchTerm = request.SearchTerm.ToLower();
			query = query.Where(a => 
				a.Action.ToLower().Contains(searchTerm) ||
				a.ResourceType.ToLower().Contains(searchTerm) ||
				a.Method.ToLower().Contains(searchTerm) ||
				a.Path.ToLower().Contains(searchTerm) ||
				a.IpAddress.ToLower().Contains(searchTerm)
			);
		}
		
		// Apply sorting
		if (!string.IsNullOrWhiteSpace(request.SortBy))
		{
			query = request.SortBy.ToLower() switch
			{
				"action" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(a => a.Action)
					: query.OrderBy(a => a.Action),
				"resourcetype" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(a => a.ResourceType)
					: query.OrderBy(a => a.ResourceType),
				"method" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(a => a.Method)
					: query.OrderBy(a => a.Method),
				"statuscode" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(a => a.StatusCode)
					: query.OrderBy(a => a.StatusCode),
				"durationms" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(a => a.DurationMs)
					: query.OrderBy(a => a.DurationMs),
				_ => query.OrderByDescending(a => a.OccurredAtUtc)
			};
		}
		else
		{
			query = query.OrderByDescending(a => a.OccurredAtUtc);
		}
		
		// Get total count
		var totalCount = await query.CountAsync(ct);
		
		// Apply pagination
		var items = await query
			.Skip((request.Page - 1) * request.PageSize)
			.Take(request.PageSize)
			.ToListAsync(ct);
		
		var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);
		
		return new PaginationResponse<AuditLog>
		{
			Items = items,
			TotalCount = totalCount,
			Page = request.Page,
			PageSize = request.PageSize,
			TotalPages = totalPages,
			HasNextPage = request.Page < totalPages,
			HasPreviousPage = request.Page > 1
		};
	}
}


