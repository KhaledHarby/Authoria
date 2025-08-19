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
		var u = await _db.Users
			.AsNoTracking()
			.Where(x => x.Id == id)
			.Select(x => new UserDto
			{
				Id = x.Id,
				Email = x.Email,
				FirstName = x.FirstName,
				LastName = x.LastName,
				Status = x.Status.ToString(),
				LastLoginAtUtc = x.LastLoginAtUtc,
				UserRoles = x.UserRoles.Select(ur => new UserRoleBriefDto
				{
					RoleId = ur.RoleId,
					RoleName = ur.Role.Name
				}).ToList()
			})
			.FirstOrDefaultAsync(ct);
		return u;
	}

	public async Task<UserDto> CreateAsync(CreateUserRequest req, CancellationToken ct = default)
	{
		if (!_current.HasPermission("user.create")) throw new UnauthorizedAccessException("Missing permission: user.create");
		if (string.IsNullOrWhiteSpace(req.Email)) throw new ArgumentException("Email required");
		if (string.IsNullOrWhiteSpace(req.Password)) throw new ArgumentException("Password required");
		
		// Hash the password properly
		var hashedPassword = _passwordHasher.HashPassword(req.Password);
		
		var user = new User 
		{ 
			Id = Guid.NewGuid(), 
			Email = req.Email, 
			PasswordHash = hashedPassword, 
			FirstName = req.FirstName, 
			LastName = req.LastName, 
			Status = UserStatus.Active 
		};
		
		_db.Users.Add(user);
		await _db.SaveChangesAsync(ct);
		
		// Audit log the user creation
		await _auditService.LogDatabaseOperationAsync("create", "user", user.Id.ToString(), new { user.Email, user.FirstName, user.LastName, user.Status });
		
		await _cache.RemoveAsync($"users:list:{_current.TenantId}", ct);
		return new UserDto { Id = user.Id, Email = user.Email, FirstName = user.FirstName, LastName = user.LastName, Status = user.Status.ToString() };
	}

	public async Task<UserDto?> UpdateAsync(Guid id, UpdateUserRequest req, CancellationToken ct = default)
	{
		if (!_current.HasPermission("user.update")) throw new UnauthorizedAccessException("Missing permission: user.update");
		var u = await _db.Users.FindAsync(new object?[] { id }, ct);
		if (u == null) return null;
		
		var changes = new List<string>();
		if (req.FirstName != null) { u.FirstName = req.FirstName; changes.Add("FirstName"); }
		if (req.LastName != null) { u.LastName = req.LastName; changes.Add("LastName"); }
		if (req.Status != null && Enum.TryParse<UserStatus>(req.Status, true, out var st)) { u.Status = st; changes.Add("Status"); }
		
		await _db.SaveChangesAsync(ct);
		
		// Audit log the user update
		await _auditService.LogDatabaseOperationAsync("update", "user", u.Id.ToString(), new { changes, updatedFields = req });
		
		await _cache.RemoveAsync($"users:list:{_current.TenantId}", ct);
		return new UserDto { Id = u.Id, Email = u.Email, FirstName = u.FirstName, LastName = u.LastName, Status = u.Status.ToString() };
	}

	public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
	{
		if (!_current.HasPermission("user.delete")) throw new UnauthorizedAccessException("Missing permission: user.delete");
		var u = await _db.Users.FindAsync(new object?[] { id }, ct);
		if (u == null) return false;
		
		var userInfo = new { u.Email, u.FirstName, u.LastName, u.Status };
		_db.Users.Remove(u);
		await _db.SaveChangesAsync(ct);
		
		// Audit log the user deletion
		await _auditService.LogDatabaseOperationAsync("delete", "user", id.ToString(), userInfo);
		
		await _cache.RemoveAsync($"users:list:{_current.TenantId}", ct);
		return true;
	}
}


