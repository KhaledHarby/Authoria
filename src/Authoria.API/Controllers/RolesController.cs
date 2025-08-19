using Authoria.Application.Roles;
using Authoria.Application.Common;
using Authoria.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
	private readonly IRoleService _roles;
	public RolesController(IRoleService roles) { _roles = roles; }

	[HttpGet]
	[Authorize]
	public async Task<IActionResult> List([FromQuery] PaginationRequest request) => Ok(await _roles.ListAsync(request));

	[HttpPost]
	[Authorize]
	public async Task<IActionResult> Create([FromBody] CreateRoleRequest request) => Ok(await _roles.CreateAsync(request));

	[HttpPut("{id}")]
	[Authorize]
	public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRoleRequest request)
	{
		var updatedRole = await _roles.UpdateAsync(id, request);
		return updatedRole == null ? NotFound() : Ok(updatedRole);
	}

	[HttpPost("{roleId}/permissions/{permissionId}")]
	[Authorize]
	public async Task<IActionResult> AssignPermission(Guid roleId, Guid permissionId)
		=> (await _roles.AssignPermissionAsync(roleId, permissionId)) ? NoContent() : NotFound();

	[HttpDelete("{roleId}/permissions/{permissionId}")]
	[Authorize]
	public async Task<IActionResult> RemovePermission(Guid roleId, Guid permissionId)
		=> (await _roles.RemovePermissionAsync(roleId, permissionId)) ? NoContent() : NotFound();

	[HttpPost("assign/{userId}/{roleId}")]
	[Authorize]
	public async Task<IActionResult> AssignRoleToUser(Guid userId, Guid roleId)
		=> (await _roles.AssignRoleToUserAsync(userId, roleId)) ? NoContent() : NotFound();

	[HttpDelete("assign/{userId}/{roleId}")]
	[Authorize]
	public async Task<IActionResult> RemoveRoleFromUser(Guid userId, Guid roleId)
		=> (await _roles.RemoveRoleFromUserAsync(userId, roleId)) ? NoContent() : NotFound();

	[HttpDelete("{id}")]
	[Authorize]
	public async Task<IActionResult> Delete(Guid id)
	{
		var ok = await _roles.DeleteAsync(id);
		return ok ? NoContent() : NotFound();
	}
}


