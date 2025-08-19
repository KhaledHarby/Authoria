using Authoria.Application.Abstractions;
using Authoria.Application.Roles;
using Authoria.Application.Common;
using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Authoria.Infrastructure.Services.Roles;

public class RoleService : IRoleService
{
	private readonly AuthoriaDbContext _db;
	private readonly ICurrentUserContext _current;
	public RoleService(AuthoriaDbContext db, ICurrentUserContext current) { _db = db; _current = current; }

	public async Task<PaginationResponse<RoleDto>> ListAsync(PaginationRequest request, CancellationToken ct = default)
	{
		if (!_current.HasPermission("role.view")) throw new UnauthorizedAccessException("Missing permission: role.view");
		
		var query = _db.Roles.AsNoTracking();
		
		// Apply search filter
		if (!string.IsNullOrWhiteSpace(request.SearchTerm))
		{
			var searchTerm = request.SearchTerm.ToLower();
			query = query.Where(r => 
				r.Name.ToLower().Contains(searchTerm) ||
				(r.Description != null && r.Description.ToLower().Contains(searchTerm))
			);
		}
		
		// Apply sorting
		if (!string.IsNullOrWhiteSpace(request.SortBy))
		{
			query = request.SortBy.ToLower() switch
			{
				"name" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(r => r.Name)
					: query.OrderBy(r => r.Name),
				"description" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(r => r.Description)
					: query.OrderBy(r => r.Description),
				_ => query.OrderBy(r => r.Name)
			};
		}
		else
		{
			query = query.OrderBy(r => r.Name);
		}
		
		// Get total count
		var totalCount = await query.CountAsync(ct);
		
		// Apply pagination and include role permissions
		var items = await query
			.Include(r => r.RolePermissions)
				.ThenInclude(rp => rp.Permission)
			.Include(r => r.UserRoles)
			.Skip((request.Page - 1) * request.PageSize)
			.Take(request.PageSize)
			.ToListAsync(ct);
		
		// Convert to DTOs to avoid circular references
		var roleDtos = items.Select(role => new RoleDto
		{
			Id = role.Id,
			Name = role.Name,
			Description = role.Description,
			RolePermissions = role.RolePermissions?.Select(rp => new RolePermissionDto
			{
				RoleId = rp.RoleId,
				PermissionId = rp.PermissionId,
				Permission = new PermissionDto
				{
					Id = rp.Permission.Id,
					Name = rp.Permission.Name,
					Description = rp.Permission.Description
				}
			}).ToList() ?? new List<RolePermissionDto>(),
			UserRoles = role.UserRoles?.Select(ur => new UserRoleDto
			{
				UserId = ur.UserId,
				RoleId = ur.RoleId
			}).ToList() ?? new List<UserRoleDto>()
		}).ToList();
		
		var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);
		
		return new PaginationResponse<RoleDto>
		{
			Items = roleDtos,
			TotalCount = totalCount,
			Page = request.Page,
			PageSize = request.PageSize,
			TotalPages = totalPages,
			HasNextPage = request.Page < totalPages,
			HasPreviousPage = request.Page > 1
		};
	}

	public async Task<RoleDto> CreateAsync(CreateRoleRequest request, CancellationToken ct = default)
	{
		if (!_current.HasPermission("role.create")) throw new UnauthorizedAccessException("Missing permission: role.create");
		if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Name required");
		
		var role = new Role
		{
			Id = Guid.NewGuid(),
			Name = request.Name,
			Description = request.Description
		};
		
		_db.Roles.Add(role);
		await _db.SaveChangesAsync(ct);
		
		// Return the created role as DTO with permissions included
		var createdRole = await _db.Roles
			.Include(r => r.RolePermissions)
				.ThenInclude(rp => rp.Permission)
			.Include(r => r.UserRoles)
			.FirstAsync(r => r.Id == role.Id, ct);
		
		return new RoleDto
		{
			Id = createdRole.Id,
			Name = createdRole.Name,
			Description = createdRole.Description,
			RolePermissions = createdRole.RolePermissions?.Select(rp => new RolePermissionDto
			{
				RoleId = rp.RoleId,
				PermissionId = rp.PermissionId,
				Permission = new PermissionDto
				{
					Id = rp.Permission.Id,
					Name = rp.Permission.Name,
					Description = rp.Permission.Description
				}
			}).ToList() ?? new List<RolePermissionDto>(),
			UserRoles = createdRole.UserRoles?.Select(ur => new UserRoleDto
			{
				UserId = ur.UserId,
				RoleId = ur.RoleId
			}).ToList() ?? new List<UserRoleDto>()
		};
	}

	public async Task<RoleDto?> UpdateAsync(Guid id, UpdateRoleRequest request, CancellationToken ct = default)
	{
		if (!_current.HasPermission("role.update")) throw new UnauthorizedAccessException("Missing permission: role.update");
		var existingRole = await _db.Roles
			.Include(r => r.RolePermissions)
				.ThenInclude(rp => rp.Permission)
			.Include(r => r.UserRoles)
			.FirstOrDefaultAsync(r => r.Id == id, ct);
		
		if (existingRole == null) return null;
		
		existingRole.Name = request.Name;
		existingRole.Description = request.Description;
		
		await _db.SaveChangesAsync(ct);
		
		return new RoleDto
		{
			Id = existingRole.Id,
			Name = existingRole.Name,
			Description = existingRole.Description,
			RolePermissions = existingRole.RolePermissions?.Select(rp => new RolePermissionDto
			{
				RoleId = rp.RoleId,
				PermissionId = rp.PermissionId,
				Permission = new PermissionDto
				{
					Id = rp.Permission.Id,
					Name = rp.Permission.Name,
					Description = rp.Permission.Description
				}
			}).ToList() ?? new List<RolePermissionDto>(),
			UserRoles = existingRole.UserRoles?.Select(ur => new UserRoleDto
			{
				UserId = ur.UserId,
				RoleId = ur.RoleId
			}).ToList() ?? new List<UserRoleDto>()
		};
	}

	public async Task<bool> AssignPermissionAsync(Guid roleId, Guid permissionId, CancellationToken ct = default)
	{
		if (!_current.HasPermission("permission.assign")) throw new UnauthorizedAccessException("Missing permission: permission.assign");
		if (!await _db.Roles.AnyAsync(r => r.Id == roleId, ct) || !await _db.Permissions.AnyAsync(p => p.Id == permissionId, ct)) return false;
		
		// Check if the permission is already assigned to this role
		var existingAssignment = await _db.RolePermissions
			.FirstOrDefaultAsync(rp => rp.RoleId == roleId && rp.PermissionId == permissionId, ct);
		
		if (existingAssignment != null)
		{
			// Permission is already assigned, return true
			return true;
		}
		
		// Add the new permission assignment
		_db.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = permissionId });
		await _db.SaveChangesAsync(ct);
		return true;
	}

	public async Task<bool> RemovePermissionAsync(Guid roleId, Guid permissionId, CancellationToken ct = default)
	{
		if (!_current.HasPermission("permission.assign")) throw new UnauthorizedAccessException("Missing permission: permission.assign");
		
		var existingAssignment = await _db.RolePermissions
			.FirstOrDefaultAsync(rp => rp.RoleId == roleId && rp.PermissionId == permissionId, ct);
		
		if (existingAssignment == null)
		{
			// Permission is not assigned, return true (nothing to remove)
			return true;
		}
		
		// Remove the permission assignment
		_db.RolePermissions.Remove(existingAssignment);
		await _db.SaveChangesAsync(ct);
		return true;
	}

	public async Task<bool> AssignRoleToUserAsync(Guid userId, Guid roleId, CancellationToken ct = default)
	{
		if (!_current.HasPermission("role.assign")) throw new UnauthorizedAccessException("Missing permission: role.assign");
		if (!await _db.Users.AnyAsync(u => u.Id == userId, ct) || !await _db.Roles.AnyAsync(r => r.Id == roleId, ct)) return false;
		
		// Remove any existing role assignments for this user
		var existingUserRoles = await _db.UserRoles.Where(ur => ur.UserId == userId).ToListAsync(ct);
		_db.UserRoles.RemoveRange(existingUserRoles);
		
		// Add the new role assignment
		_db.UserRoles.Add(new UserRole { UserId = userId, RoleId = roleId });
		await _db.SaveChangesAsync(ct);
		return true;
	}

	public async Task<bool> RemoveRoleFromUserAsync(Guid userId, Guid roleId, CancellationToken ct = default)
	{
		if (!_current.HasPermission("role.assign")) throw new UnauthorizedAccessException("Missing permission: role.assign");
		var userRole = await _db.UserRoles.FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId, ct);
		if (userRole == null) return false;
		_db.UserRoles.Remove(userRole);
		await _db.SaveChangesAsync(ct);
		return true;
	}

	public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
	{
		if (!_current.HasPermission("role.delete")) throw new UnauthorizedAccessException("Missing permission: role.delete");
		var role = await _db.Roles.FindAsync(new object?[] { id }, ct);
		if (role == null) return false;
		_db.Roles.Remove(role);
		await _db.SaveChangesAsync(ct);
		return true;
	}
}


