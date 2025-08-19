using Authoria.Application.Users;
using Authoria.Application.Users.Dtos;
using Authoria.Application.Common;
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
	public UsersController(IUserService users) { _users = users; }

	[HttpGet]
	[Authorize]
	public async Task<IActionResult> List([FromQuery] PaginationRequest request) => Ok(await _users.ListAsync(request));

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
}


