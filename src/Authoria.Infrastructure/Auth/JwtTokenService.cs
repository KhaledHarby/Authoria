using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Authoria.Application.Abstractions;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Authoria.Infrastructure.Auth;

public class JwtTokenService : ITokenService
{
	private readonly IConfiguration _config;
	public JwtTokenService(IConfiguration config) => _config = config;

	public (string token, DateTime expiresAtUtc) CreateAccessToken(Guid userId, Guid? tenantId, IEnumerable<string> roles, IEnumerable<string> permissions)
	{
		var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"] ?? "change_me"));
		var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
		var expires = DateTime.UtcNow.AddMinutes(int.TryParse(_config["Jwt:AccessTokenMinutes"], out var m) ? m : 15);
		var claims = new List<Claim>
		{
			new(JwtRegisteredClaimNames.Sub, userId.ToString()),
			new("tid", tenantId?.ToString() ?? string.Empty),
		};
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


