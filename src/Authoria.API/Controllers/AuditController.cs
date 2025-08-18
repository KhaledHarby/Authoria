using Authoria.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuditController : ControllerBase
{
	private readonly AuthoriaDbContext _db;
	public AuditController(AuthoriaDbContext db) { _db = db; }

	[HttpGet]
	[Authorize]
	public async Task<IActionResult> Query() => Ok(new { items = await _db.AuditLogs.AsNoTracking().OrderByDescending(a => a.OccurredAtUtc).Take(200).ToListAsync() });
}


