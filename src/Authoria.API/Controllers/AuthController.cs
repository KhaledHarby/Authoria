using Authoria.Application.Abstractions;
using Authoria.Application.Auth;
using Authoria.Application.Auth.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
	private readonly IAuthService _auth;
	public AuthController(IAuthService auth) => _auth = auth;

	[HttpGet("health")]
	public IActionResult Health() => Ok(new { status = "ok" });

	[HttpPost("login")]
	public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
	{
		var resp = await _auth.LoginAsync(req, Request.Headers.UserAgent, HttpContext.Connection.RemoteIpAddress?.ToString());
		return resp == null ? Unauthorized() : Ok(resp);
	}

	[HttpPost("refresh")]
	public async Task<ActionResult<LoginResponse>> Refresh([FromBody] RefreshTokenRequest req)
	{
		var resp = await _auth.RefreshAsync(req);
		return resp == null ? Unauthorized() : Ok(resp);
	}

	[HttpPost("forgot-password")]
	public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
	{
		await _auth.ForgotPasswordAsync(req);
		return Ok();
	}

	[HttpPost("reset-password")]
	public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
	{
		var ok = await _auth.ResetPasswordAsync(req);
		return ok ? NoContent() : BadRequest();
	}
}



