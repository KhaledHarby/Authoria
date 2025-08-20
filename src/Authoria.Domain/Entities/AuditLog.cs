namespace Authoria.Domain.Entities;

public class AuditLog
{
	public Guid Id { get; set; }
	public Guid? TenantId { get; set; }
	public Guid? ActorUserId { get; set; }
	public string ActorType { get; set; } = "user"; // user|system
	public string Action { get; set; } = string.Empty; // e.g., user.create, auth.login
	public string ResourceType { get; set; } = string.Empty; // e.g., user, role
	public string? ResourceId { get; set; }
	public string Method { get; set; } = string.Empty; // HTTP verb or CRUD
	public string Path { get; set; } = string.Empty;
	public string IpAddress { get; set; } = string.Empty;
	public string UserAgent { get; set; } = string.Empty;
	public int? StatusCode { get; set; }
	public long? DurationMs { get; set; }
	public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
	public string? DetailsJson { get; set; }
	public Guid? ApplicationId { get; set; }
}




