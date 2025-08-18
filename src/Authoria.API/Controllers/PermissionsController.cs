using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PermissionsController : ControllerBase
{
	private readonly AuthoriaDbContext _db;
	public PermissionsController(AuthoriaDbContext db) { _db = db; }

	[HttpGet]
	[Authorize]
	public async Task<IActionResult> List() => Ok(await _db.Permissions.AsNoTracking().ToListAsync());

	[HttpPost]
	[Authorize]
	public async Task<IActionResult> Create([FromBody] Permission p)
	{
		p.Id = Guid.NewGuid();
		_db.Permissions.Add(p);
		await _db.SaveChangesAsync();
		return Ok(p);
	}
}


