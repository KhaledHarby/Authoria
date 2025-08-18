using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocalizationController : ControllerBase
{
	private readonly AuthoriaDbContext _db;
	public LocalizationController(AuthoriaDbContext db) { _db = db; }

	[HttpGet]
	[Authorize]
	public async Task<IActionResult> List() => Ok(await _db.LocalizationLabels.AsNoTracking().ToListAsync());

	[HttpPost]
	[Authorize]
	public async Task<IActionResult> Upsert([FromBody] LocalizationLabel l)
	{
		if (l.Id == Guid.Empty) l.Id = Guid.NewGuid();
		_db.LocalizationLabels.Update(l);
		await _db.SaveChangesAsync();
		return Ok(l);
	}
}


