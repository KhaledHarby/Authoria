using Authoria.Application.Audit;
using Authoria.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditController : ControllerBase
{
    private readonly IAuditQueryService _auditQueryService;
    private readonly IAuditService _auditService;

    public AuditController(IAuditQueryService auditQueryService, IAuditService auditService)
    {
        _auditQueryService = auditQueryService;
        _auditService = auditService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginationResponse<AuditLogDto>>> List([FromQuery] PaginationRequest request)
    {
        try
        {
            var logsResponse = await _auditQueryService.ListAsync(request, HttpContext.RequestAborted);
            
            // Log the audit access
            await _auditService.LogUserActionAsync(
                "audit.view",
                "audit",
                null,
                new { 
                    page = request.Page, 
                    pageSize = request.PageSize, 
                    searchTerm = request.SearchTerm,
                    actionType = request.ActionType,
                    status = request.Status,
                    timeRange = request.TimeRange
                }
            );

            var dtos = logsResponse.Items.Select(log => new AuditLogDto
            {
                Id = log.Id,
                TenantId = log.TenantId,
                ActorUserId = log.ActorUserId,
                ActorType = log.ActorType,
                Action = log.Action,
                ResourceType = log.ResourceType,
                ResourceId = log.ResourceId,
                Method = log.Method,
                Path = log.Path,
                IpAddress = log.IpAddress,
                UserAgent = log.UserAgent,
                StatusCode = log.StatusCode,
                DurationMs = log.DurationMs,
                OccurredAtUtc = log.OccurredAtUtc,
                DetailsJson = log.DetailsJson
            }).ToList();

            return Ok(new PaginationResponse<AuditLogDto>
            {
                Items = dtos,
                TotalCount = logsResponse.TotalCount,
                Page = logsResponse.Page,
                PageSize = logsResponse.PageSize,
                TotalPages = logsResponse.TotalPages,
                HasNextPage = logsResponse.HasNextPage,
                HasPreviousPage = logsResponse.HasPreviousPage
            });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("recent")]
    public async Task<ActionResult<List<AuditLogDto>>> Recent([FromQuery] int take = 50)
    {
        try
        {
            var logs = await _auditQueryService.RecentAsync(take, HttpContext.RequestAborted);
            
            // Log the recent audit access
            await _auditService.LogUserActionAsync(
                "audit.recent",
                "audit",
                null,
                new { take }
            );

            var dtos = logs.Select(log => new AuditLogDto
            {
                Id = log.Id,
                TenantId = log.TenantId,
                ActorUserId = log.ActorUserId,
                ActorType = log.ActorType,
                Action = log.Action,
                ResourceType = log.ResourceType,
                ResourceId = log.ResourceId,
                Method = log.Method,
                Path = log.Path,
                IpAddress = log.IpAddress,
                UserAgent = log.UserAgent,
                StatusCode = log.StatusCode,
                DurationMs = log.DurationMs,
                OccurredAtUtc = log.OccurredAtUtc,
                DetailsJson = log.DetailsJson
            }).ToList();

            return Ok(dtos);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}

public class AuditLogDto
{
    public Guid Id { get; set; }
    public Guid? TenantId { get; set; }
    public Guid? ActorUserId { get; set; }
    public string ActorType { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string ResourceType { get; set; } = string.Empty;
    public string? ResourceId { get; set; }
    public string Method { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public int? StatusCode { get; set; }
    public long? DurationMs { get; set; }
    public DateTime OccurredAtUtc { get; set; }
    public string? DetailsJson { get; set; }
}


