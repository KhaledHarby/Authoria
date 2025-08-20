using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Authoria.Application.Abstractions;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Authoria.Infrastructure.Services.Auth;

public class JwtTokenService : ITokenService
{
	private readonly IConfiguration _config;
	public JwtTokenService(IConfiguration config) => _config = config;

	public (string token, DateTime expiresAtUtc) CreateAccessToken(Guid userId, Guid? tenantId, IEnumerable<string> roles, IEnumerable<string> permissions, Guid? applicationId = null, IEnumerable<Guid>? applicationIds = null, int? expiryMinutes = null)
	{
		var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"] ?? "change_me"));
		var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
		
		// Use custom expiry minutes if provided, otherwise fallback to config, then default to 50 minutes
		var minutesToExpire = expiryMinutes ?? 
		                      (int.TryParse(_config["Jwt:AccessTokenMinutes"], out var m) ? m : 50);
		var expires = DateTime.UtcNow.AddMinutes(minutesToExpire);
		var claims = new List<Claim>
		{
			new(JwtRegisteredClaimNames.Sub, userId.ToString()),
			new("tid", tenantId?.ToString() ?? string.Empty),
		};
		
		// Add application claims
		if (applicationId.HasValue)
		{
			claims.Add(new Claim("aid", applicationId.Value.ToString()));
		}
		
		if (applicationIds != null && applicationIds.Any())
		{
			foreach (var appId in applicationIds)
			{
				claims.Add(new Claim("aid", appId.ToString()));
			}
		}
		
		claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));
		claims.AddRange(permissions.Select(p => new Claim("perm", p)));
		var jwt = new JwtSecurityToken(
			issuer: _config["Jwt:Issuer"],
			audience: _config["Jwt:Audience"],
			claims: claims,
			expires: expires,
			signingCredentials: creds
		);
		return (new JwtSecurityTokenHandler().WriteToken(jwt), expires);
	}

	public (string refreshToken, DateTime expiresAtUtc) CreateRefreshToken(Guid userId, string? device, string? ip)
	{
		var token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()) + Convert.ToBase64String(Guid.NewGuid().ToByteArray());
		var expires = DateTime.UtcNow.AddDays(int.TryParse(_config["Jwt:RefreshTokenDays"], out var d) ? d : 30);
		return (token, expires);
	}
}


