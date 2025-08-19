using Authoria.Application.Webhooks;
using Authoria.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
	private readonly IWebhookService _webhooks;
	public WebhooksController(IWebhookService webhooks) { _webhooks = webhooks; }

	[HttpGet("subscriptions")]
	[Authorize]
	public async Task<IActionResult> ListSubscriptions() => Ok(await _webhooks.ListAsync());

	[HttpPost("subscriptions")]
	[Authorize]
	public async Task<IActionResult> Create([FromBody] WebhookSubscription s) => Ok(await _webhooks.CreateAsync(s));

	[HttpPost("subscriptions/test")]
	[Authorize]
	public IActionResult TestDelivery() => Ok(new { success = true });
}


