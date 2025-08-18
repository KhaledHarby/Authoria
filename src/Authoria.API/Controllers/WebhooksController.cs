using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
	private readonly AuthoriaDbContext _db;
	public WebhooksController(AuthoriaDbContext db) { _db = db; }

	[HttpGet("subscriptions")]
	[Authorize]
	public async Task<IActionResult> ListSubscriptions() => Ok(await _db.WebhookSubscriptions.AsNoTracking().ToListAsync());

	[HttpPost("subscriptions")]
	[Authorize]
	public async Task<IActionResult> Create([FromBody] WebhookSubscription s)
	{
		s.Id = Guid.NewGuid();
		_db.WebhookSubscriptions.Add(s);
		await _db.SaveChangesAsync();
		return Ok(s);
	}

	[HttpPost("subscriptions/test")]
	[Authorize]
	public IActionResult TestDelivery() => Ok(new { success = true });
}


