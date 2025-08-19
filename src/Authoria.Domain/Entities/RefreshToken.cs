namespace Authoria.Domain.Entities;

public class RefreshToken
{
	public Guid Id { get; set; }
	public Guid UserId { get; set; }
	public string Token { get; set; } = string.Empty;
	public DateTime ExpiresAtUtc { get; set; }
	public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
	public DateTime? RevokedAtUtc { get; set; }
	public string? Device { get; set; }
	public string? IpAddress { get; set; }
}



