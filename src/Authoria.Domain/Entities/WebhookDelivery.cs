namespace Authoria.Domain.Entities;

public class WebhookDelivery
{
	public Guid Id { get; set; } // Delivery Id
	public Guid SubscriptionId { get; set; }
	public Guid EventId { get; set; }
	public string EventType { get; set; } = string.Empty;
	public int AttemptNumber { get; set; }
	public int? StatusCode { get; set; }
	public long? DurationMs { get; set; }
	public string? ResponseBodyExcerpt { get; set; }
	public DateTimeOffset? NextAttemptAtUtc { get; set; }
	public DateTimeOffset? CompletedAtUtc { get; set; }
	public DateTimeOffset CreatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}




