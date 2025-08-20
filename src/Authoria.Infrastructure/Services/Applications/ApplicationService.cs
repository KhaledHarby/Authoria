using Authoria.Application.Abstractions;
using Authoria.Application.Applications;
using Authoria.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Authoria.Infrastructure.Services.Applications;

public class ApplicationService : IApplicationService
{
	private readonly AuthoriaDbContext _db;
	private readonly ICurrentUserContext _current;

	public ApplicationService(AuthoriaDbContext db, ICurrentUserContext current)
	{
		_db = db;
		_current = current;
	}

	public async Task<List<ApplicationDto>> ListAsync(CancellationToken ct = default)
	{
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required");
		var userId = _current.UserId;
		var activeIds = userId.HasValue 
			? await _db.UserApplications.AsNoTracking().Where(ua => ua.UserId == userId.Value && ua.IsActive).Select(ua => ua.ApplicationId).ToListAsync(ct)
			: new List<Guid>();
		return await _db.Applications.AsNoTracking()
			.Where(a => a.TenantId == tenantId)
			.OrderBy(a => a.Name)
			.Select(a => new ApplicationDto
			{
				Id = a.Id,
				TenantId = a.TenantId,
				Name = a.Name,
				Description = a.Description,
				CreatedAtUtc = a.CreatedAtUtc,
				IsActive = activeIds.Contains(a.Id)
			})
			.ToListAsync(ct);
	}

	public async Task<ApplicationDto> CreateAsync(CreateApplicationRequest request, CancellationToken ct = default)
	{
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required");
		if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Name is required");
		var exists = await _db.Applications.AnyAsync(a => a.TenantId == tenantId && a.Name == request.Name.Trim(), ct);
		if (exists) throw new InvalidOperationException("Application with this name already exists");
		var app = new Domain.Entities.Application
		{
			Id = Guid.NewGuid(),
			TenantId = tenantId,
			Name = request.Name.Trim(),
			Description = request.Description,
			CreatedAtUtc = DateTime.UtcNow
		};
		_db.Applications.Add(app);
		await _db.SaveChangesAsync(ct);
		return new ApplicationDto
		{
			Id = app.Id,
			TenantId = app.TenantId,
			Name = app.Name,
			Description = app.Description,
			CreatedAtUtc = app.CreatedAtUtc
		};
	}

	public async Task<ApplicationDto> UpdateAsync(Guid id, CreateApplicationRequest request, CancellationToken ct = default)
	{
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required");
		if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Name is required");
		
		var app = await _db.Applications.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId, ct);
		if (app == null) throw new KeyNotFoundException("Application not found");
		
		// Check if name is being changed and if the new name already exists
		if (app.Name != request.Name.Trim())
		{
			var nameExists = await _db.Applications.AnyAsync(a => a.TenantId == tenantId && a.Name == request.Name.Trim() && a.Id != id, ct);
			if (nameExists) throw new InvalidOperationException("Application with this name already exists");
		}
		
		app.Name = request.Name.Trim();
		app.Description = request.Description;
		
		await _db.SaveChangesAsync(ct);
		
		return new ApplicationDto
		{
			Id = app.Id,
			TenantId = app.TenantId,
			Name = app.Name,
			Description = app.Description,
			CreatedAtUtc = app.CreatedAtUtc
		};
	}

	public async Task DeleteAsync(Guid id, CancellationToken ct = default)
	{
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required");
		
		var app = await _db.Applications.FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId, ct);
		if (app == null) throw new KeyNotFoundException("Application not found");
		
		// Check if there are any active user associations
		var hasActiveUsers = await _db.UserApplications.AnyAsync(ua => ua.ApplicationId == id && ua.IsActive, ct);
		if (hasActiveUsers) throw new InvalidOperationException("Cannot delete application with active user associations");
		
		// Remove all user associations
		var userAssociations = await _db.UserApplications.Where(ua => ua.ApplicationId == id).ToListAsync(ct);
		_db.UserApplications.RemoveRange(userAssociations);
		
		// Remove all user permissions for this application
		var userPermissions = await _db.UserPermissions.Where(up => up.ApplicationId == id).ToListAsync(ct);
		_db.UserPermissions.RemoveRange(userPermissions);
		
		// Remove the application
		_db.Applications.Remove(app);
		
		await _db.SaveChangesAsync(ct);
	}

	public async Task<List<UserApplicationItem>> ListUserApplicationsAsync(Guid userId, CancellationToken ct = default)
	{
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required");
		return await _db.UserApplications.AsNoTracking()
			.Where(ua => ua.UserId == userId)
			.Join(_db.Applications.Where(a => a.TenantId == tenantId), ua => ua.ApplicationId, a => a.Id, (ua, a) => new UserApplicationItem
			{
				Id = a.Id,
				Name = a.Name
			})
			.ToListAsync(ct);
	}

	public async Task AddUserAsync(Guid applicationId, Guid userId, CancellationToken ct = default)
	{
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required");
		var app = await _db.Applications.FirstOrDefaultAsync(a => a.Id == applicationId && a.TenantId == tenantId, ct);
		if (app == null) throw new ArgumentException("Application not found");
		var exists = await _db.UserApplications.AnyAsync(ua => ua.ApplicationId == applicationId && ua.UserId == userId, ct);
		if (!exists)
		{
			_db.UserApplications.Add(new Domain.Entities.UserApplication { ApplicationId = applicationId, UserId = userId });
			await _db.SaveChangesAsync(ct);
		}
	}

	public async Task RemoveUserAsync(Guid applicationId, Guid userId, CancellationToken ct = default)
	{
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required");
		var appExists = await _db.Applications.AnyAsync(a => a.Id == applicationId && a.TenantId == tenantId, ct);
		if (!appExists) throw new ArgumentException("Application not found");
		var link = await _db.UserApplications.FirstOrDefaultAsync(ua => ua.ApplicationId == applicationId && ua.UserId == userId, ct);
		if (link == null) return;
		_db.UserApplications.Remove(link);
		await _db.SaveChangesAsync(ct);
	}

	public async Task<List<ApplicationUserDto>> ListApplicationUsersAsync(Guid applicationId, CancellationToken ct = default)
	{
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required");
		var appExists = await _db.Applications.AnyAsync(a => a.Id == applicationId && a.TenantId == tenantId, ct);
		if (!appExists) throw new ArgumentException("Application not found");
		return await _db.UserApplications.AsNoTracking()
			.Where(ua => ua.ApplicationId == applicationId)
			.Join(_db.Users, ua => ua.UserId, u => u.Id, (ua, u) => new ApplicationUserDto
			{
				Id = u.Id,
				FirstName = u.FirstName,
				LastName = u.LastName,
				Email = u.Email
			})
			.ToListAsync(ct);
	}

	public async Task SetActiveAsync(Guid applicationId, bool isActive, CancellationToken ct = default)
	{
		var userId = _current.UserId ?? throw new InvalidOperationException("UserId is required");
		var tenantId = _current.TenantId ?? throw new InvalidOperationException("TenantId is required");
		var app = await _db.Applications.FirstOrDefaultAsync(a => a.Id == applicationId && a.TenantId == tenantId, ct);
		if (app == null) throw new ArgumentException("Application not found");

		var link = await _db.UserApplications.FirstOrDefaultAsync(ua => ua.UserId == userId && ua.ApplicationId == applicationId, ct);
		if (link == null)
		{
			link = new Domain.Entities.UserApplication { UserId = userId, ApplicationId = applicationId, IsActive = isActive };
			_db.UserApplications.Add(link);
		}
		else
		{
			link.IsActive = isActive;
		}
		await _db.SaveChangesAsync(ct);
	}

	public async Task<List<Guid>> GetActiveApplicationIdsAsync(CancellationToken ct = default)
	{
		var userId = _current.UserId ?? throw new InvalidOperationException("UserId is required");
		var ids = await _db.UserApplications.AsNoTracking()
			.Where(ua => ua.UserId == userId && ua.IsActive)
			.Select(ua => ua.ApplicationId)
			.ToListAsync(ct);
		return ids;
	}
}
