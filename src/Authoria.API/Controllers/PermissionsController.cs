using Authoria.Application.Permissions;
using Authoria.Application.Common;
using Authoria.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Authoria.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PermissionsController : ControllerBase
{
	private readonly IPermissionService _perms;
	public PermissionsController(IPermissionService perms) { _perms = perms; }

	[HttpGet]
	[Authorize]
	public async Task<IActionResult> List([FromQuery] PaginationRequest request) => Ok(await _perms.ListAsync(request));

	[HttpPost]
	[Authorize]
	public async Task<IActionResult> Create([FromBody] Permission p) => Ok(await _perms.CreateAsync(p));
}


