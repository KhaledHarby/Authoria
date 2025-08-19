using Authoria.Domain.Entities;

namespace Authoria.Application.Audit;

public interface IAuditService
{
    Task LogAsync(AuditLogEntry entry, CancellationToken ct = default);
    Task LogDatabaseOperationAsync(string operation, string entityType, string? entityId, object? data = null, CancellationToken ct = default);
    Task LogApiCallAsync(string method, string path, int statusCode, long durationMs, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default);
    Task LogUserActionAsync(string action, string resourceType, string? resourceId, object? details = null, CancellationToken ct = default);
}

public class AuditLogEntry
{
    public Guid? TenantId { get; set; }
    public Guid? ActorUserId { get; set; }
    public string ActorType { get; set; } = "user";
    public string Action { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public string? ResourceId { get; set; }
    public string Method { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public int? StatusCode { get; set; }
    public long? DurationMs { get; set; }
    public object? Details { get; set; }
}
