using Authoria.Application.Abstractions;
using Authoria.Application.Permissions;
using Authoria.Application.Common;
using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Authoria.Infrastructure.Services.Permissions;

public class PermissionService : IPermissionService
{
	private readonly AuthoriaDbContext _db;
	private readonly ICurrentUserContext _current;
	public PermissionService(AuthoriaDbContext db, ICurrentUserContext current) { _db = db; _current = current; }

	public async Task<PaginationResponse<Permission>> ListAsync(PaginationRequest request, CancellationToken ct = default)
	{
		if (!_current.HasPermission("permission.view")) throw new UnauthorizedAccessException("Missing permission: permission.view");
		
		var query = _db.Permissions.AsNoTracking();
		
		// Apply search filter
		if (!string.IsNullOrWhiteSpace(request.SearchTerm))
		{
			var searchTerm = request.SearchTerm.ToLower();
			query = query.Where(p => 
				p.Name.ToLower().Contains(searchTerm) ||
				(p.Description != null && p.Description.ToLower().Contains(searchTerm))
			);
		}
		
		// Apply sorting
		if (!string.IsNullOrWhiteSpace(request.SortBy))
		{
			query = request.SortBy.ToLower() switch
			{
				"name" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(p => p.Name)
					: query.OrderBy(p => p.Name),
				"description" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(p => p.Description)
					: query.OrderBy(p => p.Description),
				_ => query.OrderBy(p => p.Name)
			};
		}
		else
		{
			query = query.OrderBy(p => p.Name);
		}
		
		// Get total count
		var totalCount = await query.CountAsync(ct);
		
		// Apply pagination
		var items = await query
			.Skip((request.Page - 1) * request.PageSize)
			.Take(request.PageSize)
			.ToListAsync(ct);
		
		var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);
		
		return new PaginationResponse<Permission>
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

	public async Task<Permission> CreateAsync(Permission permission, CancellationToken ct = default)
	{
		if (!_current.HasPermission("permission.create")) throw new UnauthorizedAccessException("Missing permission: permission.create");
		if (string.IsNullOrWhiteSpace(permission.Name)) throw new ArgumentException("Name required");
		permission.Id = permission.Id == Guid.Empty ? Guid.NewGuid() : permission.Id;
		_db.Permissions.Add(permission);
		await _db.SaveChangesAsync(ct);
		return permission;
	}
}


