namespace Authoria.Domain.Entities;

public class WebhookSubscription
{
	public Guid Id { get; set; }
	public Guid TenantId { get; set; }
	public string TargetUrlEncrypted { get; set; } = string.Empty; // encrypted at rest
	public string SecretHash { get; set; } = string.Empty; // hashed + peppered
	public bool IsActive { get; set; } = true;
	public string EventsCsv { get; set; } = string.Empty; // e.g., user.created,role.updated
	public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}




