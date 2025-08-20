using Authoria.Application.Abstractions;
using Authoria.Application.Users;
using Authoria.Application.Users.Dtos;
using Authoria.Application.Common;
using Authoria.Application.Audit;
using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Authoria.Infrastructure.Services.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace Authoria.Infrastructure.Services.Users;

public class UserService : IUserService
{
	private readonly AuthoriaDbContext _db;
	private readonly ICurrentUserContext _current;
	private readonly IDistributedCache _cache;
	private readonly IPasswordHasher _passwordHasher;
	private readonly IAuditService _auditService;
	private static readonly TimeSpan CacheTtl = TimeSpan.FromMinutes(5);
	
	public UserService(AuthoriaDbContext db, ICurrentUserContext current, IDistributedCache cache, IPasswordHasher passwordHasher, IAuditService auditService)
	{
		_db = db; 
		_current = current; 
		_cache = cache;
		_passwordHasher = passwordHasher;
		_auditService = auditService;
	}

	public async Task<PaginationResponse<UserDto>> ListAsync(PaginationRequest request, CancellationToken ct = default)
	{
		if (!_current.HasPermission("user.view")) throw new UnauthorizedAccessException("Missing permission: user.view");
		
		var query = _db.Users.AsNoTracking();
		
		        // Scope by tenant
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required in context");
		query = query.Where(u => _db.UserTenants.Any(ut => ut.UserId == u.Id && ut.TenantId == tenantId));

        // Scope by application if selected
        if (_current.ApplicationId.HasValue)
        {
            // If specific application is selected, show only users linked to that application
            query = query.Where(u => _db.UserApplications.Any(ua => ua.UserId == u.Id && ua.ApplicationId == _current.ApplicationId.Value && ua.IsActive));
        }
        else if (_current.ApplicationIds.Any())
        {
            // If multiple applications are selected, show users linked to any of those applications
            query = query.Where(u => _db.UserApplications.Any(ua => ua.UserId == u.Id && _current.ApplicationIds.Contains(ua.ApplicationId) && ua.IsActive));
        }
        // If no application is selected, show all users in the tenant (no additional filtering)

        // Apply search filter
        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
		{
			var searchTerm = request.SearchTerm.ToLower();
			query = query.Where(u =>
				u.FirstName.ToLower().Contains(searchTerm) ||
				u.LastName.ToLower().Contains(searchTerm) ||
				u.Email.ToLower().Contains(searchTerm)
			);
		}
		
		// Apply sorting
		if (!string.IsNullOrWhiteSpace(request.SortBy))
		{
			query = request.SortBy.ToLower() switch
			{
				"firstname" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(u => u.FirstName)
					: query.OrderBy(u => u.FirstName),
				"lastname" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(u => u.LastName)
					: query.OrderBy(u => u.LastName),
				"email" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(u => u.Email)
					: query.OrderBy(u => u.Email),
				"status" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(u => u.Status)
					: query.OrderBy(u => u.Status),
				_ => query.OrderBy(u => u.FirstName)
			};
		}
		else
		{
			query = query.OrderBy(u => u.FirstName);
		}
		
		// Get total count
		var totalCount = await query.CountAsync(ct);
		
		// Apply pagination
		var items = await query
			.Skip((request.Page - 1) * request.PageSize)
			.Take(request.PageSize)
			.Select(u => new UserDto
			{
				Id = u.Id,
				Email = u.Email,
				FirstName = u.FirstName,
				LastName = u.LastName,
				Status = u.Status.ToString(),
				LastLoginAtUtc = u.LastLoginAtUtc,
				UserRoles = u.UserRoles.Select(ur => new UserRoleBriefDto
				{
					RoleId = ur.RoleId,
					RoleName = ur.Role.Name
				}).ToList()
			})
			.ToListAsync(ct);
		
		var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);
		
		return new PaginationResponse<UserDto>
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

	public async Task<PaginationResponse<UserDto>> ListAllTenantUsersAsync(PaginationRequest request, CancellationToken ct = default)
	{
		if (!_current.HasPermission("user.view")) throw new UnauthorizedAccessException("Missing permission: user.view");
		
		var query = _db.Users.AsNoTracking();
		
		// Scope by tenant only - no application filtering
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required in context");
		query = query.Where(u => _db.UserTenants.Any(ut => ut.UserId == u.Id && ut.TenantId == tenantId));

		// Apply search filter
		if (!string.IsNullOrWhiteSpace(request.SearchTerm))
		{
			var searchTerm = request.SearchTerm.ToLower();
			query = query.Where(u =>
				u.FirstName.ToLower().Contains(searchTerm) ||
				u.LastName.ToLower().Contains(searchTerm) ||
				u.Email.ToLower().Contains(searchTerm)
			);
		}
		
		// Apply sorting
		if (!string.IsNullOrWhiteSpace(request.SortBy))
		{
			query = request.SortBy.ToLower() switch
			{
				"firstname" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(u => u.FirstName)
					: query.OrderBy(u => u.FirstName),
				"lastname" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(u => u.LastName)
					: query.OrderBy(u => u.LastName),
				"email" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(u => u.Email)
					: query.OrderBy(u => u.Email),
				"status" => request.SortDirection?.ToLower() == "desc" 
					? query.OrderByDescending(u => u.Status)
					: query.OrderBy(u => u.Status),
				_ => query.OrderBy(u => u.FirstName)
			};
		}
		else
		{
			query = query.OrderBy(u => u.FirstName);
		}
		
		// Get total count
		var totalCount = await query.CountAsync(ct);
		
		// Apply pagination
		var items = await query
			.Skip((request.Page - 1) * request.PageSize)
			.Take(request.PageSize)
			.Select(u => new UserDto
			{
				Id = u.Id,
				Email = u.Email,
				FirstName = u.FirstName,
				LastName = u.LastName,
				Status = u.Status.ToString(),
				LastLoginAtUtc = u.LastLoginAtUtc,
				UserRoles = u.UserRoles.Select(ur => new UserRoleBriefDto
				{
					RoleId = ur.RoleId,
					RoleName = ur.Role.Name
				}).ToList()
			})
			.ToListAsync(ct);
		
		var totalPages = (int)Math.Ceiling((double)totalCount / request.PageSize);
		
		return new PaginationResponse<UserDto>
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

	public async Task<UserDto?> GetAsync(Guid id, CancellationToken ct = default)
	{
		if (!_current.HasPermission("user.view")) throw new UnauthorizedAccessException("Missing permission: user.view");
		
		var user = await _db.Users
			.AsNoTracking()
			.Include(u => u.UserRoles)
				.ThenInclude(ur => ur.Role)
			.FirstOrDefaultAsync(u => u.Id == id, ct);
		
		if (user == null) return null;
		
		return new UserDto
		{
			Id = user.Id,
			Email = user.Email,
			FirstName = user.FirstName,
			LastName = user.LastName,
			Status = user.Status.ToString(),
			LastLoginAtUtc = user.LastLoginAtUtc,
			UserRoles = user.UserRoles.Select(ur => new UserRoleBriefDto
			{
				RoleId = ur.RoleId,
				RoleName = ur.Role.Name
			}).ToList()
		};
	}

	public async Task<UserDto> CreateAsync(CreateUserRequest req, CancellationToken ct = default)
	{
		if (!_current.HasPermission("user.create")) throw new UnauthorizedAccessException("Missing permission: user.create");
		
		var passwordHash = _passwordHasher.HashPassword(req.Password);
		
		var user = new User
		{
			Email = req.Email,
			PasswordHash = passwordHash,
			FirstName = req.FirstName,
			LastName = req.LastName,
			Status = UserStatus.Active
		};
		
		_db.Users.Add(user);
		await _db.SaveChangesAsync(ct);
		
		await _auditService.LogUserActionAsync("user.created", "User", user.Id.ToString(), new { req.Email, req.FirstName, req.LastName }, ct);
		
		return new UserDto
		{
			Id = user.Id,
			Email = user.Email,
			FirstName = user.FirstName,
			LastName = user.LastName,
			Status = user.Status.ToString(),
			UserRoles = new List<UserRoleBriefDto>()
		};
	}

	public async Task<UserDto?> UpdateAsync(Guid id, UpdateUserRequest req, CancellationToken ct = default)
	{
		if (!_current.HasPermission("user.update")) throw new UnauthorizedAccessException("Missing permission: user.update");
		
		var user = await _db.Users
			.Include(u => u.UserRoles)
				.ThenInclude(ur => ur.Role)
			.FirstOrDefaultAsync(u => u.Id == id, ct);
		
		if (user == null) return null;
		
		var oldValues = new { user.Email, user.FirstName, user.LastName, user.Status };
		
		if (!string.IsNullOrWhiteSpace(req.FirstName))
			user.FirstName = req.FirstName;
		if (!string.IsNullOrWhiteSpace(req.LastName))
			user.LastName = req.LastName;
		if (!string.IsNullOrWhiteSpace(req.Status))
			user.Status = Enum.Parse<UserStatus>(req.Status);
		
		await _db.SaveChangesAsync(ct);
		
		await _auditService.LogUserActionAsync("user.updated", "User", user.Id.ToString(), new { oldValues, newValues = req }, ct);
		
		return new UserDto
		{
			Id = user.Id,
			Email = user.Email,
			FirstName = user.FirstName,
			LastName = user.LastName,
			Status = user.Status.ToString(),
			LastLoginAtUtc = user.LastLoginAtUtc,
			UserRoles = user.UserRoles.Select(ur => new UserRoleBriefDto
			{
				RoleId = ur.RoleId,
				RoleName = ur.Role.Name
			}).ToList()
		};
	}

	public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
	{
		if (!_current.HasPermission("user.delete")) throw new UnauthorizedAccessException("Missing permission: user.delete");
		
		var user = await _db.Users.FindAsync(new object[] { id }, ct);
		if (user == null) return false;
		
		_db.Users.Remove(user);
		await _db.SaveChangesAsync(ct);
		
		await _auditService.LogUserActionAsync("user.deleted", "User", user.Id.ToString(), new { user.Email, user.FirstName, user.LastName }, ct);
		
		return true;
	}

	// Permission management methods
	public async Task<UserPermissionsResponse> GetUserPermissionsAsync(Guid userId, CancellationToken ct = default)
	{
		if (!_current.HasPermission("user.permissions.view")) throw new UnauthorizedAccessException("Missing permission: user.permissions.view");
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required in context");
		var appIds = _current.ApplicationIds.Any() ? _current.ApplicationIds : ( _current.ApplicationId.HasValue ? new [] { _current.ApplicationId.Value } : Array.Empty<Guid>() );
		
		var user = await _db.Users
			.AsNoTracking()
			.Include(u => u.UserRoles)
				.ThenInclude(ur => ur.Role)
					.ThenInclude(r => r.RolePermissions)
						.ThenInclude(rp => rp.Permission)
			.Include(u => u.UserPermissions.Where(up => up.TenantId == tenantId && (appIds.Count() == 0 || appIds.Contains(up.ApplicationId))))
				.ThenInclude(up => up.Permission)
			.Include(u => u.UserPermissions.Where(up => up.TenantId == tenantId && (appIds.Count() == 0 || appIds.Contains(up.ApplicationId))))
				.ThenInclude(up => up.GrantedByUser)
			.FirstOrDefaultAsync(u => u.Id == userId, ct);
		
		if (user == null) throw new ArgumentException("User not found");
		
		var directPermissions = user.UserPermissions.Select(up => new UserPermissionDto
		{
			Id = up.Id,
			UserId = up.UserId,
			PermissionId = up.PermissionId,
			PermissionName = up.Permission.Name,
			PermissionDescription = up.Permission.Description,
			GrantedAtUtc = up.GrantedAtUtc,
			GrantedByUserId = up.GrantedByUserId,
			GrantedByUserName = up.GrantedByUser != null ? $"{up.GrantedByUser.FirstName} {up.GrantedByUser.LastName}" : null,
			Notes = up.Notes
		}).ToList();
		
		var rolePermissions = user.UserRoles.Select(ur => new RolePermissionDto
		{
			RoleId = ur.RoleId,
			RoleName = ur.Role.Name,
			Permissions = ur.Role.RolePermissions.Select(rp => rp.Permission.Name).ToList()
		}).ToList();
		
		var allPermissions = new HashSet<string>(directPermissions.Select(p => p.PermissionName));
		foreach (var role in rolePermissions)
			foreach (var p in role.Permissions)
				allPermissions.Add(p);
		
		return new UserPermissionsResponse
		{
			UserId = user.Id,
			UserName = $"{user.FirstName} {user.LastName}",
			DirectPermissions = directPermissions,
			RolePermissions = rolePermissions,
			AllPermissions = allPermissions.ToList()
		};
	}

	public async Task<UserPermissionDto> AssignPermissionAsync(AssignUserPermissionRequest request, Guid grantedByUserId, CancellationToken ct = default)
	{
		if (!_current.HasPermission("user.permissions.assign")) throw new UnauthorizedAccessException("Missing permission: user.permissions.assign");
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required in context");
		var applicationId = _current.ApplicationId ?? throw new InvalidOperationException("ApplicationId is required in context");
		
		var existingPermission = await _db.UserPermissions
			.FirstOrDefaultAsync(up => up.UserId == request.UserId && up.PermissionId == request.PermissionId && up.TenantId == tenantId && up.ApplicationId == applicationId, ct);
		if (existingPermission != null) throw new InvalidOperationException("Permission already assigned to user for this tenant and application");
		
		var userPermission = new UserPermission
		{
			UserId = request.UserId,
			PermissionId = request.PermissionId,
			TenantId = tenantId,
			ApplicationId = applicationId,
			GrantedByUserId = grantedByUserId,
			Notes = request.Notes
		};
		
		_db.UserPermissions.Add(userPermission);
		await _db.SaveChangesAsync(ct);
		
		var permission = await _db.Permissions.FindAsync(new object[] { request.PermissionId }, ct);
		var grantedByUser = await _db.Users.FindAsync(new object[] { grantedByUserId }, ct);
		
		await _auditService.LogUserActionAsync("user.permission.assigned", "UserPermission", userPermission.Id.ToString(), new { request.UserId, request.PermissionId, tenantId, applicationId, request.Notes }, ct);
		
		return new UserPermissionDto
		{
			Id = userPermission.Id,
			UserId = userPermission.UserId,
			PermissionId = userPermission.PermissionId,
			PermissionName = permission?.Name ?? string.Empty,
			PermissionDescription = permission?.Description,
			GrantedAtUtc = userPermission.GrantedAtUtc,
			GrantedByUserId = userPermission.GrantedByUserId,
			GrantedByUserName = grantedByUser != null ? $"{grantedByUser.FirstName} {grantedByUser.LastName}" : null,
			Notes = userPermission.Notes
		};
	}

	public async Task<bool> RemovePermissionAsync(RemoveUserPermissionRequest request, CancellationToken ct = default)
	{
		if (!_current.HasPermission("user.permissions.remove")) throw new UnauthorizedAccessException("Missing permission: user.permissions.remove");
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required in context");
		var applicationId = _current.ApplicationId ?? throw new InvalidOperationException("ApplicationId is required in context");
		
		var userPermission = await _db.UserPermissions
			.FirstOrDefaultAsync(up => up.UserId == request.UserId && up.PermissionId == request.PermissionId && up.TenantId == tenantId && up.ApplicationId == applicationId, ct);
		if (userPermission == null) return false;
		
		_db.UserPermissions.Remove(userPermission);
		await _db.SaveChangesAsync(ct);
		
		await _auditService.LogUserActionAsync("user.permission.removed", "UserPermission", userPermission.Id.ToString(), new { userPermission.UserId, userPermission.PermissionId, tenantId, applicationId }, ct);
		return true;
	}

	public async Task<List<string>> GetUserAllPermissionsAsync(Guid userId, CancellationToken ct = default)
	{
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required in context");
		var appIds = _current.ApplicationIds.Any() ? _current.ApplicationIds : ( _current.ApplicationId.HasValue ? new [] { _current.ApplicationId.Value } : Array.Empty<Guid>() );
		
		var user = await _db.Users
			.AsNoTracking()
			.Include(u => u.UserRoles)
				.ThenInclude(ur => ur.Role)
					.ThenInclude(r => r.RolePermissions)
						.ThenInclude(rp => rp.Permission)
			.Include(u => u.UserPermissions.Where(up => up.TenantId == tenantId && (appIds.Count() == 0 || appIds.Contains(up.ApplicationId))))
				.ThenInclude(up => up.Permission)
			.FirstOrDefaultAsync(u => u.Id == userId, ct);
		if (user == null) return new List<string>();
		
		var allPermissions = new HashSet<string>(user.UserPermissions.Select(up => up.Permission.Name));
		foreach (var ur in user.UserRoles)
			foreach (var rp in ur.Role.RolePermissions)
				allPermissions.Add(rp.Permission.Name);
		return allPermissions.ToList();
	}
}


