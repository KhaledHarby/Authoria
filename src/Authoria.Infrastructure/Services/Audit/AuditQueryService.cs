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
		
		// Apply ActionType filter
		if (!string.IsNullOrWhiteSpace(request.ActionType))
		{
			var actionType = request.ActionType.ToLower();
			query = actionType switch
			{
				"auth" => query.Where(a => a.Action.ToLower().Contains("auth.") || a.Action.ToLower().Contains("login") || a.Action.ToLower().Contains("logout")),
				"user" => query.Where(a => a.Action.ToLower().Contains("user.") || a.ResourceType.ToLower().Contains("user")),
				"api" => query.Where(a => a.Action.ToLower().Contains("api.") || a.Method.ToLower() == "get" || a.Method.ToLower() == "post" || a.Method.ToLower() == "put" || a.Method.ToLower() == "delete"),
				"db" => query.Where(a => a.Action.ToLower().Contains("db.") || a.Action.ToLower().Contains("database")),
				"create" => query.Where(a => a.Action.ToLower().Contains("create") || a.Action.ToLower().Contains("add")),
				"update" => query.Where(a => a.Action.ToLower().Contains("update") || a.Action.ToLower().Contains("edit") || a.Action.ToLower().Contains("modify")),
				"delete" => query.Where(a => a.Action.ToLower().Contains("delete") || a.Action.ToLower().Contains("remove")),
				_ => query
			};
		}
		
		// Apply Status filter
		if (!string.IsNullOrWhiteSpace(request.Status))
		{
			var status = request.Status.ToLower();
			query = status switch
			{
				"success" => query.Where(a => a.StatusCode >= 200 && a.StatusCode < 300),
				"redirect" => query.Where(a => a.StatusCode >= 300 && a.StatusCode < 400),
				"client-error" => query.Where(a => a.StatusCode >= 400 && a.StatusCode < 500),
				"server-error" => query.Where(a => a.StatusCode >= 500),
				"error" => query.Where(a => a.StatusCode >= 400),
				_ => query
			};
		}
		
		// Apply Time range filter
		if (!string.IsNullOrWhiteSpace(request.TimeRange))
		{
			var now = DateTime.UtcNow;
			var timeRange = request.TimeRange.ToLower();
			var startDate = timeRange switch
			{
				"1h" => now.AddHours(-1),
				"24h" => now.AddHours(-24),
				"7d" => now.AddDays(-7),
				"30d" => now.AddDays(-30),
				"90d" => now.AddDays(-90),
				"1y" => now.AddYears(-1),
				_ => DateTime.MinValue // "all" or invalid value
			};
			
			if (startDate != DateTime.MinValue)
			{
				query = query.Where(a => a.OccurredAtUtc >= startDate);
			}
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
				"occurredatutc" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(a => a.OccurredAtUtc)
					: query.OrderBy(a => a.OccurredAtUtc),
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


