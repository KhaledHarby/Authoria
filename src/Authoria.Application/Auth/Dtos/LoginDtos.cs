namespace Authoria.Application.Auth.Dtos;

public class LoginRequest
{
	public string Email { get; set; } = string.Empty;
	public string Password { get; set; } = string.Empty;
	public Guid? TenantId { get; set; }
}

public class LoginResponse
{
	public string AccessToken { get; set; } = string.Empty;
	public string RefreshToken { get; set; } = string.Empty;
	public string TokenType { get; set; } = "Bearer";
	public DateTime ExpiresAtUtc { get; set; }
}

public class RefreshTokenRequest
{
	public string RefreshToken { get; set; } = string.Empty;
}


