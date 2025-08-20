using Authoria.Application.Users;
using Authoria.Application.Users.Dtos;
using Authoria.Application.Common;
using Authoria.Application.Abstractions;
using Authoria.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
	private readonly IUserService _users;
	private readonly ICurrentUserContext _current;
	public UsersController(IUserService users, ICurrentUserContext current) { 
		_users = users; 
		_current = current;
	}

	[HttpGet]
	[Authorize]
	public async Task<IActionResult> List([FromQuery] PaginationRequest request) => Ok(await _users.ListAsync(request));

	[HttpGet("all-tenant")]
	[Authorize]
	public async Task<IActionResult> ListAllTenantUsers([FromQuery] PaginationRequest request) => Ok(await _users.ListAllTenantUsersAsync(request));

	[HttpGet("{id}")]
	[Authorize]
	public async Task<ActionResult<UserDto>> Get(Guid id)
	{
		var u = await _users.GetAsync(id);
		return u == null ? NotFound() : Ok(u);
	}

	[HttpPost]
	[Authorize]
	public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserRequest req)
	{
		var user = await _users.CreateAsync(req);
		return CreatedAtAction(nameof(Get), new { id = user.Id }, user);
	}

	[HttpPut("{id}")]
	[Authorize]
	public async Task<ActionResult<UserDto>> Update(Guid id, [FromBody] UpdateUserRequest req)
	{
		var u = await _users.UpdateAsync(id, req);
		return u == null ? NotFound() : Ok(u);
	}

	[HttpDelete("{id}")]
	[Authorize]
	public async Task<IActionResult> Delete(Guid id)
	{
		var ok = await _users.DeleteAsync(id);
		return ok ? NoContent() : NotFound();
	}

	[HttpGet("debug-context")]
	[Authorize]
	public IActionResult DebugContext()
	{
		return Ok(new 
		{
			ApplicationId = _current.ApplicationId,
			ApplicationIds = _current.ApplicationIds.ToArray(),
			TenantId = _current.TenantId,
			UserId = _current.UserId,
			Headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString())
		});
	}
}


