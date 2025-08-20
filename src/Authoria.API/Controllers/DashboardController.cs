using Authoria.Application.Audit;
using Authoria.Application.Users;
using Authoria.Application.Roles;
using Authoria.Application.Permissions;
using Authoria.Application.Applications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Authoria.Domain.Entities;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IAuditQueryService _auditQueryService;
    private readonly IUserService _userService;
    private readonly IRoleService _roleService;
    private readonly IPermissionService _permissionService;
    private readonly IApplicationService _applicationService;

    public DashboardController(
        IAuditQueryService auditQueryService,
        IUserService userService,
        IRoleService roleService,
        IPermissionService permissionService,
        IApplicationService applicationService)
    {
        _auditQueryService = auditQueryService;
        _userService = userService;
        _roleService = roleService;
        _permissionService = permissionService;
        _applicationService = applicationService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        try
        {
            var recentLogs = await _auditQueryService.RecentAsync(100, HttpContext.RequestAborted);

            var userResponse = await _userService.ListAsync(new Application.Common.PaginationRequest
            {
                Page = 1,
                PageSize = 1
            }, HttpContext.RequestAborted);

            var roleResponse = await _roleService.ListAsync(new Application.Common.PaginationRequest
            {
                Page = 1,
                PageSize = 1
            }, HttpContext.RequestAborted);

            var permissionResponse = await _permissionService.ListAsync(new Application.Common.PaginationRequest
            {
                Page = 1,
                PageSize = 1
            }, HttpContext.RequestAborted);

            var apps = await _applicationService.ListAsync(HttpContext.RequestAborted);
            var activeAppIds = await _applicationService.GetActiveApplicationIdsAsync(HttpContext.RequestAborted);

            var stats = new DashboardStatsDto
            {
                TotalUsers = userResponse.TotalCount,
                ActiveRoles = roleResponse.TotalCount,
                TotalPermissions = permissionResponse.TotalCount,
                TotalAuditEvents = recentLogs.Count > 0 ? recentLogs.Count : 0,
                RecentActivityCount = recentLogs.Count,
                TotalApplications = apps.Count,
                ActiveApplications = activeAppIds.Count
            };

            return Ok(stats);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to retrieve dashboard statistics", error = ex.Message });
        }
    }

    [HttpGet("recent-activities")]
    public async Task<ActionResult<List<RecentActivityDto>>> GetRecentActivities([FromQuery] int take = 10)
    {
        try
        {
            var logs = await _auditQueryService.RecentAsync(take * 2, HttpContext.RequestAborted);
            var meaningfulActivities = new List<RecentActivityDto>();

            foreach (var log in logs)
            {
                var activity = CreateMeaningfulActivity(log);
                if (activity != null)
                {
                    meaningfulActivities.Add(activity);
                    if (meaningfulActivities.Count >= take)
                        break;
                }
            }

            return Ok(meaningfulActivities);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to retrieve recent activities", error = ex.Message });
        }
    }

    private RecentActivityDto? CreateMeaningfulActivity(AuditLog log)
    {
        try
        {
            var action = log.Action.ToLower();
            var resourceType = log.ResourceType.ToLower();
            Dictionary<string, object>? details = null;
            if (!string.IsNullOrEmpty(log.DetailsJson))
            {
                try
                {
                    details = JsonSerializer.Deserialize<Dictionary<string, object>>(log.DetailsJson);
                }
                catch (JsonException)
                {
                    details = null;
                }
            }
            if (action.Contains("create") && resourceType.Contains("user"))
            {
                var userName = GetUserNameFromDetails(details);
                return new RecentActivityDto
                {
                    Id = log.Id,
                    Title = "New User Created",
                    Description = $"User '{userName}' was created",
                    Icon = "person_add",
                    Color = "#3b82f6",
                    OccurredAtUtc = log.OccurredAtUtc,
                    ActorUserId = log.ActorUserId
                };
            }
            if (action.Contains("update") && resourceType.Contains("user"))
            {
                var userName = GetUserNameFromDetails(details);
                return new RecentActivityDto
                {
                    Id = log.Id,
                    Title = "User Updated",
                    Description = $"User '{userName}' was updated",
                    Icon = "person",
                    Color = "#f59e0b",
                    OccurredAtUtc = log.OccurredAtUtc,
                    ActorUserId = log.ActorUserId
                };
            }
            if ((action.Contains("assign") || action.Contains("add")) && resourceType.Contains("role"))
            {
                var roleName = GetRoleNameFromDetails(details);
                var userName = GetUserNameFromDetails(details);
                return new RecentActivityDto
                {
                    Id = log.Id,
                    Title = "Role Assigned",
                    Description = $"'{roleName}' role has been assigned to '{userName}'",
                    Icon = "security",
                    Color = "#10b981",
                    OccurredAtUtc = log.OccurredAtUtc,
                    ActorUserId = log.ActorUserId
                };
            }
            if ((action.Contains("remove") || action.Contains("delete")) && resourceType.Contains("role"))
            {
                var roleName = GetRoleNameFromDetails(details);
                var userName = GetUserNameFromDetails(details);
                return new RecentActivityDto
                {
                    Id = log.Id,
                    Title = "Role Removed",
                    Description = $"'{roleName}' role has been removed from '{userName}'",
                    Icon = "security",
                    Color = "#ef4444",
                    OccurredAtUtc = log.OccurredAtUtc,
                    ActorUserId = log.ActorUserId
                };
            }
            if (action.Contains("create") && resourceType.Contains("role"))
            {
                var roleName = GetRoleNameFromDetails(details);
                return new RecentActivityDto
                {
                    Id = log.Id,
                    Title = "New Role Created",
                    Description = $"Role '{roleName}' was created",
                    Icon = "security",
                    Color = "#8b5cf6",
                    OccurredAtUtc = log.OccurredAtUtc,
                    ActorUserId = log.ActorUserId
                };
            }
            if ((action.Contains("grant") || action.Contains("assign")) && resourceType.Contains("permission"))
            {
                var permissionName = GetPermissionNameFromDetails(details);
                var targetName = GetTargetNameFromDetails(details);
                return new RecentActivityDto
                {
                    Id = log.Id,
                    Title = "Permission Granted",
                    Description = $"Permission '{permissionName}' was granted to '{targetName}'",
                    Icon = "key",
                    Color = "#059669",
                    OccurredAtUtc = log.OccurredAtUtc,
                    ActorUserId = log.ActorUserId
                };
            }
            if (action.Contains("login") || (action.Contains("auth") && action.Contains("success")))
            {
                var userName = GetUserNameFromDetails(details);
                return new RecentActivityDto
                {
                    Id = log.Id,
                    Title = "User Login",
                    Description = $"User '{userName}' logged in",
                    Icon = "login",
                    Color = "#3b82f6",
                    OccurredAtUtc = log.OccurredAtUtc,
                    ActorUserId = log.ActorUserId
                };
            }
            if (resourceType.Contains("localization") || resourceType.Contains("label"))
            {
                var labelKey = GetLabelKeyFromDetails(details);
                return new RecentActivityDto
                {
                    Id = log.Id,
                    Title = "Localization Updated",
                    Description = $"Localization label '{labelKey}' was updated",
                    Icon = "translate",
                    Color = "#8b5cf6",
                    OccurredAtUtc = log.OccurredAtUtc,
                    ActorUserId = log.ActorUserId
                };
            }
            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error processing audit log {log.Id}: {ex.Message}");
            return null;
        }
    }

    private string GetUserNameFromDetails(Dictionary<string, object>? details)
    {
        if (details == null) return "Unknown User";
        if (details.TryGetValue("userName", out var userName) && userName != null)
            return userName.ToString() ?? "Unknown User";
        if (details.TryGetValue("email", out var email) && email != null)
            return email.ToString() ?? "Unknown User";
        if (details.TryGetValue("name", out var name) && name != null)
            return name.ToString() ?? "Unknown User";
        return "Unknown User";
    }

    private string GetRoleNameFromDetails(Dictionary<string, object>? details)
    {
        if (details == null) return "Unknown Role";
        if (details.TryGetValue("roleName", out var roleName) && roleName != null)
            return roleName.ToString() ?? "Unknown Role";
        if (details.TryGetValue("name", out var name) && name != null)
            return name.ToString() ?? "Unknown Role";
        return "Unknown Role";
    }

    private string GetPermissionNameFromDetails(Dictionary<string, object>? details)
    {
        if (details == null) return "Unknown Permission";
        if (details.TryGetValue("permissionName", out var permissionName) && permissionName != null)
            return permissionName.ToString() ?? "Unknown Permission";
        if (details.TryGetValue("name", out var name) && name != null)
            return name.ToString() ?? "Unknown Permission";
        return "Unknown Permission";
    }

    private string GetTargetNameFromDetails(Dictionary<string, object>? details)
    {
        if (details == null) return "Unknown Target";
        if (details.TryGetValue("targetName", out var targetName) && targetName != null)
            return targetName.ToString() ?? "Unknown Target";
        if (details.TryGetValue("userName", out var userName) && userName != null)
            return userName.ToString() ?? "Unknown Target";
        if (details.TryGetValue("roleName", out var roleName) && roleName != null)
            return roleName.ToString() ?? "Unknown Target";
        return "Unknown Target";
    }

    private string GetLabelKeyFromDetails(Dictionary<string, object>? details)
    {
        if (details == null) return "Unknown Label";
        if (details.TryGetValue("key", out var key) && key != null)
            return key.ToString() ?? "Unknown Label";
        if (details.TryGetValue("labelKey", out var labelKey) && labelKey != null)
            return labelKey.ToString() ?? "Unknown Label";
        return "Unknown Label";
    }
}

public class DashboardStatsDto
{
    public int TotalUsers { get; set; }
    public int ActiveRoles { get; set; }
    public int TotalPermissions { get; set; }
    public int TotalAuditEvents { get; set; }
    public int RecentActivityCount { get; set; }
    public int TotalApplications { get; set; }
    public int ActiveApplications { get; set; }
}

public class RecentActivityDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public DateTime OccurredAtUtc { get; set; }
    public Guid? ActorUserId { get; set; }
}

