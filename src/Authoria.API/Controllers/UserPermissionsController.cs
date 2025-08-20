using Authoria.Application.Users;
using Authoria.Application.Users.Dtos;
using Authoria.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserPermissionsController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ICurrentUserContext _currentUserContext;

    public UserPermissionsController(IUserService userService, ICurrentUserContext currentUserContext)
    {
        _userService = userService;
        _currentUserContext = currentUserContext;
    }

    [HttpGet("user/{userId}")]
    public async Task<ActionResult<UserPermissionsResponse>> GetUserPermissions(Guid userId, CancellationToken ct = default)
    {
        try
        {
            var permissions = await _userService.GetUserPermissionsAsync(userId, ct);
            return Ok(permissions);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving user permissions", error = ex.Message });
        }
    }

    [HttpPost("assign")]
    public async Task<ActionResult<UserPermissionDto>> AssignPermission([FromBody] AssignUserPermissionRequest request, CancellationToken ct = default)
    {
        try
        {
            var grantedByUserId = _currentUserContext.UserId ?? throw new UnauthorizedAccessException("User not authenticated");
            var permission = await _userService.AssignPermissionAsync(request, grantedByUserId, ct);
            return Ok(permission);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while assigning permission", error = ex.Message });
        }
    }

    [HttpDelete("remove")]
    public async Task<ActionResult> RemovePermission([FromBody] RemoveUserPermissionRequest request, CancellationToken ct = default)
    {
        try
        {
            var removed = await _userService.RemovePermissionAsync(request, ct);
            if (!removed)
            {
                return NotFound(new { message = "Permission not found for this user" });
            }
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while removing permission", error = ex.Message });
        }
    }

    [HttpGet("user/{userId}/all")]
    public async Task<ActionResult<List<string>>> GetUserAllPermissions(Guid userId, CancellationToken ct = default)
    {
        try
        {
            var permissions = await _userService.GetUserAllPermissionsAsync(userId, ct);
            return Ok(permissions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred while retrieving user permissions", error = ex.Message });
        }
    }
}
