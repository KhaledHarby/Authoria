namespace Authoria.Application.Abstractions;

public interface ITokenService
{
	(string token, DateTime expiresAtUtc) CreateAccessToken(Guid userId, Guid? tenantId, IEnumerable<string> roles, IEnumerable<string> permissions);
	(string refreshToken, DateTime expiresAtUtc) CreateRefreshToken(Guid userId, string? device, string? ip);
}



