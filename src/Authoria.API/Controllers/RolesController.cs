using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
	private readonly AuthoriaDbContext _db;
	public RolesController(AuthoriaDbContext db) { _db = db; }

	[HttpGet]
	[Authorize]
	public async Task<IActionResult> List() => Ok(await _db.Roles.AsNoTracking().ToListAsync());

	[HttpPost]
	[Authorize]
	public async Task<IActionResult> Create([FromBody] Role role)
	{
		role.Id = Guid.NewGuid();
		_db.Roles.Add(role);
		await _db.SaveChangesAsync();
		return Ok(role);
	}

	[HttpPost("{roleId}/permissions/{permissionId}")]
	[Authorize]
	public async Task<IActionResult> AssignPermission(Guid roleId, Guid permissionId)
	{
		if (!await _db.Roles.AnyAsync(r => r.Id == roleId) || !await _db.Permissions.AnyAsync(p => p.Id == permissionId)) return NotFound();
		_db.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = permissionId });
		await _db.SaveChangesAsync();
		return NoContent();
	}

	[HttpPost("assign/{userId}/{roleId}")]
	[Authorize]
	public async Task<IActionResult> AssignRoleToUser(Guid userId, Guid roleId)
	{
		if (!await _db.Users.AnyAsync(u => u.Id == userId) || !await _db.Roles.AnyAsync(r => r.Id == roleId)) return NotFound();
		_db.UserRoles.Add(new UserRole { UserId = userId, RoleId = roleId });
		await _db.SaveChangesAsync();
		return NoContent();
	}
}


