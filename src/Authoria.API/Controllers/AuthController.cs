using Authoria.Application.Abstractions;
using Authoria.Application.Auth.Dtos;
using Authoria.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
	private readonly AuthoriaDbContext _db;
	private readonly ITokenService _tokens;
	public AuthController(AuthoriaDbContext db, ITokenService tokens)
	{
		_db = db; _tokens = tokens;
	}

	[HttpGet("health")]
	public IActionResult Health() => Ok(new { status = "ok" });

	[HttpPost("login")]
	public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
	{
		var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
		if (user == null || user.Status != Domain.Entities.UserStatus.Active)
			return Unauthorized();
		// NOTE: Password verification stub
		var roles = await _db.UserRoles.Where(x => x.UserId == user.Id).Select(x => x.Role.Name).ToListAsync();
		var permissions = await _db.RolePermissions
			.Where(rp => _db.UserRoles.Where(ur => ur.UserId == user.Id).Select(ur => ur.RoleId).Contains(rp.RoleId))
			.Select(rp => rp.Permission.Name).Distinct().ToListAsync();
		var (accessToken, exp) = _tokens.CreateAccessToken(user.Id, req.TenantId, roles, permissions);
		var (refresh, refreshExp) = _tokens.CreateRefreshToken(user.Id, Request.Headers.UserAgent, HttpContext.Connection.RemoteIpAddress?.ToString());
		_db.RefreshTokens.Add(new Domain.Entities.RefreshToken { UserId = user.Id, Token = refresh, ExpiresAtUtc = refreshExp, IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(), Device = Request.Headers.UserAgent });
		await _db.SaveChangesAsync();
		return Ok(new LoginResponse { AccessToken = accessToken, RefreshToken = refresh, ExpiresAtUtc = exp });
	}

	[HttpPost("refresh")]
	public async Task<ActionResult<LoginResponse>> Refresh([FromBody] RefreshTokenRequest req)
	{
		var rt = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.Token == req.RefreshToken && x.RevokedAtUtc == null);
		if (rt == null || rt.ExpiresAtUtc < DateTime.UtcNow) return Unauthorized();
		var user = await _db.Users.FindAsync(rt.UserId);
		if (user == null) return Unauthorized();
		var roles = await _db.UserRoles.Where(x => x.UserId == user.Id).Select(x => x.Role.Name).ToListAsync();
		var permissions = await _db.RolePermissions
			.Where(rp => _db.UserRoles.Where(ur => ur.UserId == user.Id).Select(ur => ur.RoleId).Contains(rp.RoleId))
			.Select(rp => rp.Permission.Name).Distinct().ToListAsync();
		var (accessToken, exp) = _tokens.CreateAccessToken(user.Id, null, roles, permissions);
		return Ok(new LoginResponse { AccessToken = accessToken, RefreshToken = req.RefreshToken, ExpiresAtUtc = exp });
	}
}



