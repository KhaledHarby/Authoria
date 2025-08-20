using Authoria.Application.Abstractions;
using Authoria.Application.Auth;
using Authoria.Application.Auth.Dtos;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
	private readonly IAuthService _auth;
	public AuthController(IAuthService auth) => _auth = auth;

	[HttpGet("health")]
	public IActionResult Health() => Ok(new { status = "ok" });

	[HttpGet("cors-test")]
	public IActionResult CorsTest() => Ok(new { message = "CORS is working!", timestamp = DateTime.UtcNow });

	[HttpPost("login")]
	public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
	{
		try
		{
			Console.WriteLine($"Login attempt for user: {req.Email}");
			var resp = await _auth.LoginAsync(req, Request.Headers.UserAgent, HttpContext.Connection.RemoteIpAddress?.ToString());
			Console.WriteLine($"Login result: {(resp == null ? "Failed" : "Success")}");
			return resp == null ? Unauthorized() : Ok(resp);
		}
		catch (Exception ex)
		{
			Console.WriteLine($"Login error: {ex.Message}");
			return StatusCode(500, new { error = "Internal server error" });
		}
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

	[HttpGet("decode-token")]
	public IActionResult DecodeToken([FromQuery] string? token)
	{
		// Check if token is empty or null
		if (string.IsNullOrWhiteSpace(token))
		{
			return BadRequest(new { error = "Token is required", message = "Please provide a valid JWT token in the 'token' query parameter." });
		}

		try
		{
			var handler = new JwtSecurityTokenHandler();
			var jsonToken = handler.ReadJwtToken(token);
			
			// Group claims by type to handle multiple claims with same type
			var claimsGrouped = jsonToken.Claims
				.GroupBy(c => c.Type)
				.ToDictionary(
					g => g.Key,
					g => g.Count() == 1 ? g.First().Value : (object)g.Select(c => c.Value).ToArray()
				);
			
			return Ok(new
			{
				subject = jsonToken.Subject,
				issuer = jsonToken.Issuer,
				audiences = jsonToken.Audiences?.ToArray(),
				expires = jsonToken.ValidTo,
				claims = claimsGrouped,
				applicationIds = jsonToken.Claims.Where(c => c.Type == "aid").Select(c => c.Value).ToArray(),
				roles = jsonToken.Claims.Where(c => c.Type == "role").Select(c => c.Value).ToArray(),
				permissions = jsonToken.Claims.Where(c => c.Type == "perm").Select(c => c.Value).ToArray()
			});
		}
		catch (Exception ex)
		{
			return BadRequest(new { error = "Invalid token", message = ex.Message });
		}
	}
}



