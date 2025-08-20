using Authoria.Application.Abstractions;
using Authoria.Application.Applications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ApplicationsController : ControllerBase
{
	private readonly IApplicationService _apps;
	public ApplicationsController(IApplicationService apps)
	{
		_apps = apps;
	}

	[HttpGet]
	public async Task<IActionResult> List(CancellationToken ct)
	{
		var items = await _apps.ListAsync(ct);
		return Ok(items);
	}

	[HttpPost]
	public async Task<IActionResult> Create([FromBody] CreateApplicationRequest req, CancellationToken ct)
	{
		try
		{
			var app = await _apps.CreateAsync(req, ct);
			return Ok(app);
		}
		catch (InvalidOperationException ex)
		{
			return Conflict(new { message = ex.Message });
		}
		catch (ArgumentException ex)
		{
			return BadRequest(new { message = ex.Message });
		}
	}

	[HttpPut("{id}")]
	public async Task<IActionResult> Update(Guid id, [FromBody] CreateApplicationRequest req, CancellationToken ct)
	{
		try
		{
			var app = await _apps.UpdateAsync(id, req, ct);
			return Ok(app);
		}
		catch (InvalidOperationException ex)
		{
			return Conflict(new { message = ex.Message });
		}
		catch (ArgumentException ex)
		{
			return BadRequest(new { message = ex.Message });
		}
		catch (KeyNotFoundException ex)
		{
			return NotFound(new { message = ex.Message });
		}
	}

	[HttpDelete("{id}")]
	public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
	{
		try
		{
			await _apps.DeleteAsync(id, ct);
			return NoContent();
		}
		catch (KeyNotFoundException ex)
		{
			return NotFound(new { message = ex.Message });
		}
		catch (InvalidOperationException ex)
		{
			return BadRequest(new { message = ex.Message });
		}
	}

	[HttpGet("user/{userId}")]
	public async Task<IActionResult> ListUserApplications(Guid userId, CancellationToken ct)
	{
		var apps = await _apps.ListUserApplicationsAsync(userId, ct);
		return Ok(apps);
	}

	[HttpGet("{applicationId}/users")]
	public async Task<IActionResult> ListApplicationUsers(Guid applicationId, CancellationToken ct)
	{
		var users = await _apps.ListApplicationUsersAsync(applicationId, ct);
		return Ok(users);
	}

	[HttpPost("{applicationId}/users/{userId}")]
	public async Task<IActionResult> AddUser(Guid applicationId, Guid userId, CancellationToken ct)
	{
		await _apps.AddUserAsync(applicationId, userId, ct);
		return NoContent();
	}

	[HttpDelete("{applicationId}/users/{userId}")]
	public async Task<IActionResult> RemoveUser(Guid applicationId, Guid userId, CancellationToken ct)
	{
		await _apps.RemoveUserAsync(applicationId, userId, ct);
		return NoContent();
	}

	[HttpPost("{applicationId}/active")]
	public async Task<IActionResult> SetActive(Guid applicationId, [FromQuery] bool active = true, CancellationToken ct = default)
	{
		await _apps.SetActiveAsync(applicationId, active, ct);
		return NoContent();
	}

	[HttpGet("active")]
	public async Task<IActionResult> GetActive(CancellationToken ct = default)
	{
		var ids = await _apps.GetActiveApplicationIdsAsync(ct);
		return Ok(ids);
	}
}
