using Authoria.Application.Audit;
using Authoria.Application.Abstractions;
using Authoria.Domain.Entities;
using Authoria.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Authoria.Infrastructure.Services.Audit;

public class AuditService : IAuditService
{
    private readonly AuthoriaDbContext _db;
    private readonly ICurrentUserContext _current;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditService(AuthoriaDbContext db, ICurrentUserContext current, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _current = current;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(AuditLogEntry entry, CancellationToken ct = default)
    {
        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            TenantId = entry.TenantId ?? _current.TenantId,
            ActorUserId = entry.ActorUserId ?? _current.UserId,
            ActorType = entry.ActorType,
            Action = entry.Action,
            ResourceType = entry.ResourceType,
            ResourceId = entry.ResourceId,
            Method = entry.Method,
            Path = entry.Path,
            IpAddress = entry.IpAddress,
            UserAgent = entry.UserAgent,
            StatusCode = entry.StatusCode,
            DurationMs = entry.DurationMs,
            OccurredAtUtc = DateTime.UtcNow,
            DetailsJson = entry.Details != null ? JsonSerializer.Serialize(entry.Details) : null,
            ApplicationId = entry.ApplicationId ?? _current.ApplicationId
        };

        _db.AuditLogs.Add(auditLog);
        await _db.SaveChangesAsync(ct);
    }

    public async Task LogDatabaseOperationAsync(string operation, string entityType, string? entityId, object? data = null, CancellationToken ct = default)
    {
        var entry = new AuditLogEntry
        {
            Action = $"db.{operation}",
            ResourceType = entityType,
            ResourceId = entityId,
            Method = operation.ToUpper(),
            Path = $"/db/{entityType}",
            Details = data
        };

        await LogAsync(entry, ct);
    }

    public async Task LogApiCallAsync(string method, string path, int statusCode, long durationMs, string? ipAddress = null, string? userAgent = null, CancellationToken ct = default)
    {
        var entry = new AuditLogEntry
        {
            Action = $"api.{method.ToLower()}",
            ResourceType = "api",
            Method = method,
            Path = path,
            StatusCode = statusCode,
            DurationMs = durationMs,
            IpAddress = ipAddress ?? GetClientIpAddress(),
            UserAgent = userAgent ?? GetUserAgent()
        };

        await LogAsync(entry, ct);
    }

    public async Task LogUserActionAsync(string action, string resourceType, string? resourceId, object? details = null, CancellationToken ct = default)
    {
        var entry = new AuditLogEntry
        {
            Action = action,
            ResourceType = resourceType,
            ResourceId = resourceId,
            Method = "USER_ACTION",
            Path = $"/user/{action}",
            IpAddress = GetClientIpAddress(),
            UserAgent = GetUserAgent(),
            Details = details
        };

        await LogAsync(entry, ct);
    }

    private string GetClientIpAddress()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext == null) return string.Empty;

        var forwardedHeader = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedHeader))
        {
            return forwardedHeader.Split(',')[0].Trim();
        }

        return httpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty;
    }

    private string GetUserAgent()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        return httpContext?.Request.Headers["User-Agent"].FirstOrDefault() ?? string.Empty;
    }
}
