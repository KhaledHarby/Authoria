using Authoria.Application.Audit;
using Authoria.Application.Users;
using Authoria.Application.Roles;
using Authoria.Application.Permissions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

    public DashboardController(
        IAuditQueryService auditQueryService,
        IUserService userService,
        IRoleService roleService,
        IPermissionService permissionService)
    {
        _auditQueryService = auditQueryService;
        _userService = userService;
        _roleService = roleService;
        _permissionService = permissionService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        try
        {
            // Get recent audit logs for activity count
            var recentLogs = await _auditQueryService.RecentAsync(100, HttpContext.RequestAborted);
            
            // Get user count (we'll use a simple approach for now)
            var userResponse = await _userService.ListAsync(new Application.Common.PaginationRequest 
            { 
                Page = 1, 
                PageSize = 1 
            }, HttpContext.RequestAborted);
            
            // Get role count
            var roleResponse = await _roleService.ListAsync(new Application.Common.PaginationRequest 
            { 
                Page = 1, 
                PageSize = 1 
            }, HttpContext.RequestAborted);
            
            // Get permission count
            var permissionResponse = await _permissionService.ListAsync(new Application.Common.PaginationRequest 
            { 
                Page = 1, 
                PageSize = 1 
            }, HttpContext.RequestAborted);

            var stats = new DashboardStatsDto
            {
                TotalUsers = userResponse.TotalCount,
                ActiveRoles = roleResponse.TotalCount,
                TotalPermissions = permissionResponse.TotalCount,
                TotalAuditEvents = recentLogs.Count > 0 ? recentLogs.Count : 0,
                RecentActivityCount = recentLogs.Count
            };

            return Ok(stats);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            // Log the exception
            return StatusCode(500, new { message = "Failed to retrieve dashboard statistics", error = ex.Message });
        }
    }
}

public class DashboardStatsDto
{
    public int TotalUsers { get; set; }
    public int ActiveRoles { get; set; }
    public int TotalPermissions { get; set; }
    public int TotalAuditEvents { get; set; }
    public int RecentActivityCount { get; set; }
}

