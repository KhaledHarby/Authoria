using Authoria.Application.TenantSettings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/tenant-settings")]
[Authorize]
public class TenantSettingsController : ControllerBase
{
    private readonly ITenantSettingService _tenantSettingService;

    public TenantSettingsController(ITenantSettingService tenantSettingService)
    {
        _tenantSettingService = tenantSettingService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TenantSettingDto>>> GetAll(CancellationToken ct)
    {
        var settings = await _tenantSettingService.GetAllAsync(ct);
        return Ok(settings);
    }

    [HttpGet("{key}")]
    public async Task<ActionResult<TenantSettingDto>> GetByKey(string key, CancellationToken ct)
    {
        var setting = await _tenantSettingService.GetByKeyAsync(key, ct);
        if (setting == null)
        {
            return NotFound();
        }
        return Ok(setting);
    }

    [HttpPost]
    public async Task<ActionResult<TenantSettingDto>> Set([FromBody] UpdateTenantSettingRequest request, CancellationToken ct)
    {
        var setting = await _tenantSettingService.SetAsync(request.Key, request.Value, ct);
        return Ok(setting);
    }

    [HttpDelete("{key}")]
    public async Task<IActionResult> Delete(string key, CancellationToken ct)
    {
        await _tenantSettingService.DeleteAsync(key, ct);
        return NoContent();
    }

    [HttpGet("token-expiry")]
    public async Task<ActionResult<TokenExpirySettingDto>> GetTokenExpiry(CancellationToken ct)
    {
        var setting = await _tenantSettingService.GetTokenExpiryAsync(ct);
        return Ok(setting);
    }

    [HttpPost("token-expiry")]
    public async Task<ActionResult<TokenExpirySettingDto>> SetTokenExpiry([FromBody] TokenExpirySettingDto request, CancellationToken ct)
    {
        try
        {
            var setting = await _tenantSettingService.SetTokenExpiryAsync(request.TokenExpiryMinutes, ct);
            return Ok(setting);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
