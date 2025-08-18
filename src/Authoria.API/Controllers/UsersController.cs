using Authoria.Application.Users.Dtos;
using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
	private readonly AuthoriaDbContext _db;
	public UsersController(AuthoriaDbContext db) { _db = db; }

	[HttpGet]
	[Authorize]
	public async Task<IActionResult> List()
	{
		var users = await _db.Users.Select(u => new UserDto
		{
			Id = u.Id,
			Email = u.Email,
			FirstName = u.FirstName,
			LastName = u.LastName,
			Status = u.Status.ToString()
		}).ToListAsync();
		return Ok(users);
	}

	[HttpGet("{id}")]
	[Authorize]
	public async Task<ActionResult<UserDto>> Get(Guid id)
	{
		var u = await _db.Users.FindAsync(id);
		if (u == null) return NotFound();
		return new UserDto { Id = u.Id, Email = u.Email, FirstName = u.FirstName, LastName = u.LastName, Status = u.Status.ToString() };
	}

	[HttpPost]
	[Authorize]
	public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserRequest req)
	{
		var user = new User { Id = Guid.NewGuid(), Email = req.Email, PasswordHash = "TODO_HASH", FirstName = req.FirstName, LastName = req.LastName, Status = UserStatus.Active };
		_db.Users.Add(user);
		await _db.SaveChangesAsync();
		return CreatedAtAction(nameof(Get), new { id = user.Id }, new UserDto { Id = user.Id, Email = user.Email, FirstName = user.FirstName, LastName = user.LastName, Status = user.Status.ToString() });
	}

	[HttpPut("{id}")]
	[Authorize]
	public async Task<ActionResult<UserDto>> Update(Guid id, [FromBody] UpdateUserRequest req)
	{
		var u = await _db.Users.FindAsync(id);
		if (u == null) return NotFound();
		if (req.FirstName != null) u.FirstName = req.FirstName;
		if (req.LastName != null) u.LastName = req.LastName;
		if (req.Status != null && Enum.TryParse<UserStatus>(req.Status, true, out var st)) u.Status = st;
		await _db.SaveChangesAsync();
		return new UserDto { Id = u.Id, Email = u.Email, FirstName = u.FirstName, LastName = u.LastName, Status = u.Status.ToString() };
	}

	[HttpDelete("{id}")]
	[Authorize]
	public async Task<IActionResult> Delete(Guid id)
	{
		var u = await _db.Users.FindAsync(id);
		if (u == null) return NotFound();
		_db.Users.Remove(u);
		await _db.SaveChangesAsync();
		return NoContent();
	}
}


